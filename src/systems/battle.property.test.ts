import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateAttackPower,
  calculateDefensePower,
  calculateDamage,
  checkDuel,
  checkInstantKill,
  applyHighLeadReduction,
  DUEL_TRIGGER_PROBABILITY,
  INSTANT_KILL_PROBABILITY,
  DUEL_WAR_DIFF_THRESHOLD,
  INSTANT_KILL_WAR_DIFF_THRESHOLD,
  HIGH_LEAD_THRESHOLD,
  HIGH_LEAD_DAMAGE_REDUCTION,
  DAMAGE_RANDOM_MIN,
  DAMAGE_RANDOM_MAX,
} from './battle';
import { ATTRIBUTE_MIN, ATTRIBUTE_MAX } from '../types/general';
import { DEFENSE_MAX } from '../types/city';

// 生成器定义
const validAttributeArb = fc.integer({ min: ATTRIBUTE_MIN, max: ATTRIBUTE_MAX });
const validTroopsArb = fc.integer({ min: 100, max: 100000 });
const validDefenseArb = fc.integer({ min: 0, max: DEFENSE_MAX });
const validRandomFactorArb = fc.double({ min: DAMAGE_RANDOM_MIN, max: DAMAGE_RANDOM_MAX, noNaN: true });
const validProbabilityArb = fc.double({ min: 0, max: 1, noNaN: true });

// 用于单挑测试的武力差生成器 (差值<=10)
const duelWarPairArb = fc.integer({ min: ATTRIBUTE_MIN, max: ATTRIBUTE_MAX }).chain((war1) => {
  const minWar2 = Math.max(ATTRIBUTE_MIN, war1 - DUEL_WAR_DIFF_THRESHOLD);
  const maxWar2 = Math.min(ATTRIBUTE_MAX, war1 + DUEL_WAR_DIFF_THRESHOLD);
  return fc.tuple(fc.constant(war1), fc.integer({ min: minWar2, max: maxWar2 }));
});

// 用于秒杀测试的武力差生成器 (差值>20)
const instantKillWarPairArb = fc.integer({ min: ATTRIBUTE_MIN, max: ATTRIBUTE_MAX - INSTANT_KILL_WAR_DIFF_THRESHOLD - 1 }).chain((war1) => {
  const minWar2 = war1 + INSTANT_KILL_WAR_DIFF_THRESHOLD + 1;
  return fc.tuple(fc.constant(war1), fc.integer({ min: minWar2, max: ATTRIBUTE_MAX }));
});

/**
 * **Feature: sanguo-190, Property 6: 战斗攻击力公式**
 * *For any* 战斗计算输入（兵力、武力、统帅），攻击力必须等于
 * `兵力 × (武力 × 0.4 + 统帅 × 0.6) ÷ 100`。
 * **Validates: Requirements 6.1**
 */
describe('Property 6: 战斗攻击力公式', () => {
  it('should calculate attack power correctly for any valid inputs', () => {
    fc.assert(
      fc.property(
        validTroopsArb,
        validAttributeArb,
        validAttributeArb,
        (troops, war, lead) => {
          const result = calculateAttackPower(troops, war, lead);
          const expected = (troops * (war * 0.4 + lead * 0.6)) / 100;
          expect(result).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return zero when troops is zero', () => {
    fc.assert(
      fc.property(validAttributeArb, validAttributeArb, (war, lead) => {
        const result = calculateAttackPower(0, war, lead);
        expect(result).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should always return non-negative attack power', () => {
    fc.assert(
      fc.property(
        validTroopsArb,
        validAttributeArb,
        validAttributeArb,
        (troops, war, lead) => {
          const result = calculateAttackPower(troops, war, lead);
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should scale linearly with troops', () => {
    fc.assert(
      fc.property(
        validTroopsArb,
        validAttributeArb,
        validAttributeArb,
        fc.integer({ min: 2, max: 5 }),
        (troops, war, lead, multiplier) => {
          const result1 = calculateAttackPower(troops, war, lead);
          const result2 = calculateAttackPower(troops * multiplier, war, lead);
          // Use precision 5 to account for floating-point arithmetic
          expect(result2).toBeCloseTo(result1 * multiplier, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: sanguo-190, Property 7: 战斗防御力公式**
 * *For any* 战斗计算输入（兵力、统帅、智力、城市防御度），防御力必须等于
 * `兵力 × (统帅 × 0.8 + 智力 × 0.2) ÷ 100 + 城市防御度`。
 * **Validates: Requirements 6.2**
 */
describe('Property 7: 战斗防御力公式', () => {
  it('should calculate defense power correctly for any valid inputs', () => {
    fc.assert(
      fc.property(
        validTroopsArb,
        validAttributeArb,
        validAttributeArb,
        validDefenseArb,
        (troops, lead, int, cityDefense) => {
          const result = calculateDefensePower(troops, lead, int, cityDefense);
          const expected = (troops * (lead * 0.8 + int * 0.2)) / 100 + cityDefense;
          expect(result).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return city defense when troops is zero', () => {
    fc.assert(
      fc.property(
        validAttributeArb,
        validAttributeArb,
        validDefenseArb,
        (lead, int, cityDefense) => {
          const result = calculateDefensePower(0, lead, int, cityDefense);
          expect(result).toBe(cityDefense);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always return non-negative defense power', () => {
    fc.assert(
      fc.property(
        validTroopsArb,
        validAttributeArb,
        validAttributeArb,
        validDefenseArb,
        (troops, lead, int, cityDefense) => {
          const result = calculateDefensePower(troops, lead, int, cityDefense);
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include city defense as additive bonus', () => {
    fc.assert(
      fc.property(
        validTroopsArb,
        validAttributeArb,
        validAttributeArb,
        validDefenseArb,
        fc.integer({ min: 1, max: 50 }),
        (troops, lead, int, cityDefense, delta) => {
          if (cityDefense + delta > DEFENSE_MAX) return true;
          const result1 = calculateDefensePower(troops, lead, int, cityDefense);
          const result2 = calculateDefensePower(troops, lead, int, cityDefense + delta);
          expect(result2 - result1).toBeCloseTo(delta, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: sanguo-190, Property 8: 战斗伤害范围**
 * *For any* 攻击力和防御力值，造成伤亡必须在
 * `[(攻击力 ÷ 防御力) × 300 × 0.9, (攻击力 ÷ 防御力) × 300 × 1.1]` 范围内。
 * **Validates: Requirements 6.3**
 */
describe('Property 8: 战斗伤害范围', () => {
  it('should calculate damage within expected range for any valid inputs', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 10000, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        validRandomFactorArb,
        (attackPower, defensePower, randomFactor) => {
          const result = calculateDamage(attackPower, defensePower, randomFactor);
          const baseRatio = attackPower / defensePower;
          const minExpected = Math.floor(baseRatio * 300 * DAMAGE_RANDOM_MIN);
          const maxExpected = Math.floor(baseRatio * 300 * DAMAGE_RANDOM_MAX);
          expect(result).toBeGreaterThanOrEqual(minExpected);
          expect(result).toBeLessThanOrEqual(maxExpected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate damage correctly with given random factor', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 10000, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        validRandomFactorArb,
        (attackPower, defensePower, randomFactor) => {
          const result = calculateDamage(attackPower, defensePower, randomFactor);
          const expected = Math.floor((attackPower / defensePower) * 300 * randomFactor);
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle zero defense by using minimum defense of 1', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 10000, noNaN: true }),
        validRandomFactorArb,
        (attackPower, randomFactor) => {
          const result = calculateDamage(attackPower, 0, randomFactor);
          const expected = Math.floor((attackPower / 1) * 300 * randomFactor);
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always return non-negative damage', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10000, noNaN: true }),
        fc.double({ min: 0, max: 10000, noNaN: true }),
        validRandomFactorArb,
        (attackPower, defensePower, randomFactor) => {
          const result = calculateDamage(attackPower, defensePower, randomFactor);
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: sanguo-190, Property 9: 单挑触发概率（武力差≤10）**
 * *For any* 大量战斗样本（两军主将武力差在10以内），单挑触发率应接近5%（允许统计误差）。
 * **Validates: Requirements 6.4**
 */
describe('Property 9: 单挑触发概率（武力差≤10）', () => {
  it('should trigger duel when random value is below threshold and war diff <= 10', () => {
    fc.assert(
      fc.property(
        duelWarPairArb,
        fc.double({ min: 0, max: DUEL_TRIGGER_PROBABILITY - 0.001, noNaN: true }),
        ([war1, war2], randomValue) => {
          const result = checkDuel(war1, war2, randomValue);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not trigger duel when random value is above threshold', () => {
    fc.assert(
      fc.property(
        duelWarPairArb,
        fc.double({ min: DUEL_TRIGGER_PROBABILITY, max: 1, noNaN: true }),
        ([war1, war2], randomValue) => {
          const result = checkDuel(war1, war2, randomValue);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not trigger duel when war diff > 10 regardless of random value', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: ATTRIBUTE_MIN, max: ATTRIBUTE_MAX - DUEL_WAR_DIFF_THRESHOLD - 1 }),
        fc.integer({ min: DUEL_WAR_DIFF_THRESHOLD + 1, max: ATTRIBUTE_MAX }),
        validProbabilityArb,
        (war1, warDiff, randomValue) => {
          // Ensure war2 is within valid range
          const war2 = Math.min(war1 + warDiff, ATTRIBUTE_MAX);
          if (Math.abs(war1 - war2) <= DUEL_WAR_DIFF_THRESHOLD) return true;
          const result = checkDuel(war1, war2, randomValue);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have approximately 5% trigger rate over many samples', () => {
    // Statistical test: run many samples and check the rate is close to 5%
    const sampleSize = 10000;
    let triggerCount = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      // Use war values with diff <= 10
      const war1 = 50;
      const war2 = 55;
      if (checkDuel(war1, war2)) {
        triggerCount++;
      }
    }
    
    const triggerRate = triggerCount / sampleSize;
    // Allow 2% margin of error (3% to 7%)
    expect(triggerRate).toBeGreaterThan(0.03);
    expect(triggerRate).toBeLessThan(0.07);
  });
});

/**
 * **Feature: sanguo-190, Property 10: 秒杀触发概率（武力差>20）**
 * *For any* 大量战斗样本（两军主将武力差超过20），秒杀触发率应接近1%（允许统计误差）。
 * **Validates: Requirements 6.5**
 */
describe('Property 10: 秒杀触发概率（武力差>20）', () => {
  it('should trigger instant kill when random value is below threshold and war diff > 20', () => {
    fc.assert(
      fc.property(
        instantKillWarPairArb,
        fc.double({ min: 0, max: INSTANT_KILL_PROBABILITY - 0.0001, noNaN: true }),
        ([war1, war2], randomValue) => {
          const result = checkInstantKill(war1, war2, randomValue);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not trigger instant kill when random value is above threshold', () => {
    fc.assert(
      fc.property(
        instantKillWarPairArb,
        fc.double({ min: INSTANT_KILL_PROBABILITY, max: 1, noNaN: true }),
        ([war1, war2], randomValue) => {
          const result = checkInstantKill(war1, war2, randomValue);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not trigger instant kill when war diff <= 20 regardless of random value', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: ATTRIBUTE_MIN, max: ATTRIBUTE_MAX }),
        fc.integer({ min: 0, max: INSTANT_KILL_WAR_DIFF_THRESHOLD }),
        validProbabilityArb,
        (war1, warDiff, randomValue) => {
          const war2 = Math.min(Math.max(war1 + warDiff, ATTRIBUTE_MIN), ATTRIBUTE_MAX);
          if (Math.abs(war1 - war2) > INSTANT_KILL_WAR_DIFF_THRESHOLD) return true;
          const result = checkInstantKill(war1, war2, randomValue);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have approximately 1% trigger rate over many samples', () => {
    // Statistical test: run many samples and check the rate is close to 1%
    const sampleSize = 10000;
    let triggerCount = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      // Use war values with diff > 20
      const war1 = 30;
      const war2 = 80;
      if (checkInstantKill(war1, war2)) {
        triggerCount++;
      }
    }
    
    const triggerRate = triggerCount / sampleSize;
    // Allow 0.5% margin of error (0.5% to 1.5%)
    expect(triggerRate).toBeGreaterThan(0.005);
    expect(triggerRate).toBeLessThan(0.015);
  });
});


/**
 * **Feature: sanguo-190, Property 20: 高统帅伤害减免**
 * *For any* 统帅值≥90的武将指挥的部队，受到的伤害必须应用减免系数。
 * **Validates: Requirements 4.2**
 */
describe('Property 20: 高统帅伤害减免', () => {
  it('should apply damage reduction when defender lead >= 90', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: HIGH_LEAD_THRESHOLD, max: ATTRIBUTE_MAX }),
        (damage, defenderLead) => {
          const result = applyHighLeadReduction(damage, defenderLead);
          expect(result.damageReduced).toBe(true);
          expect(result.baseDamage).toBe(damage);
          expect(result.finalDamage).toBe(Math.floor(damage * HIGH_LEAD_DAMAGE_REDUCTION));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not apply damage reduction when defender lead < 90', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: ATTRIBUTE_MIN, max: HIGH_LEAD_THRESHOLD - 1 }),
        (damage, defenderLead) => {
          const result = applyHighLeadReduction(damage, defenderLead);
          expect(result.damageReduced).toBe(false);
          expect(result.baseDamage).toBe(damage);
          expect(result.finalDamage).toBe(damage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reduce damage by exactly 20% when lead >= 90', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 10000 }),
        fc.integer({ min: HIGH_LEAD_THRESHOLD, max: ATTRIBUTE_MAX }),
        (damage, defenderLead) => {
          const result = applyHighLeadReduction(damage, defenderLead);
          const expectedReduction = damage - result.finalDamage;
          const expectedReductionPercent = expectedReduction / damage;
          // Should be approximately 20% reduction (0.2)
          expect(expectedReductionPercent).toBeGreaterThanOrEqual(0.19);
          expect(expectedReductionPercent).toBeLessThanOrEqual(0.21);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always return non-negative final damage', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        validAttributeArb,
        (damage, defenderLead) => {
          const result = applyHighLeadReduction(damage, defenderLead);
          expect(result.finalDamage).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have final damage <= base damage', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        validAttributeArb,
        (damage, defenderLead) => {
          const result = applyHighLeadReduction(damage, defenderLead);
          expect(result.finalDamage).toBeLessThanOrEqual(result.baseDamage);
        }
      ),
      { numRuns: 100 }
    );
  });
});
