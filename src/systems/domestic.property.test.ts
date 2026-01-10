import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateMonthlyIncome,
  calculateYearlyGrain,
  calculateDevelopmentIncrease,
  executeDevelopment,
  calculateRecruitmentSoldiers,
  calculatePoliticsBonus,
  DEVELOPMENT_GOLD_COST,
} from './domestic';
import { ATTRIBUTE_MIN, ATTRIBUTE_MAX } from '../types/general';
import { COMMERCE_MAX, AGRICULTURE_MAX } from '../types/city';

// 生成器定义
const validAttributeArb = fc.integer({ min: ATTRIBUTE_MIN, max: ATTRIBUTE_MAX });
const validCommerceArb = fc.integer({ min: 0, max: COMMERCE_MAX });
const validAgricultureArb = fc.integer({ min: 0, max: AGRICULTURE_MAX });
const validPopulationArb = fc.integer({ min: 1000, max: 500000 });
const validRandomArb = fc.integer({ min: 1, max: 5 });
const validGoldArb = fc.integer({ min: 0, max: 1000000 });

/**
 * **Feature: sanguo-190, Property 2: 金钱收入公式正确性**
 * *For any* 城市状态（商业值、人口、太守政治值），月度金钱收入必须等于
 * `(商业值 × 1.5 + 人口 ÷ 1000) × (太守政治 ÷ 100 + 0.5)`。
 * **Validates: Requirements 5.1**
 */
describe('Property 2: 金钱收入公式正确性', () => {
  it('should calculate monthly income correctly for any valid inputs', () => {
    fc.assert(
      fc.property(
        validCommerceArb,
        validPopulationArb,
        validAttributeArb,
        (commerce, population, governorPol) => {
          const result = calculateMonthlyIncome(commerce, population, governorPol);
          const expectedBase = commerce * 1.5 + population / 1000;
          const expectedBonus = governorPol / 100 + 0.5;
          const expected = Math.floor(expectedBase * expectedBonus);
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use default bonus (0.5) when no governor', () => {
    fc.assert(
      fc.property(validCommerceArb, validPopulationArb, (commerce, population) => {
        const result = calculateMonthlyIncome(commerce, population, null);
        const expectedBase = commerce * 1.5 + population / 1000;
        const expected = Math.floor(expectedBase * 0.5);
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('should always return non-negative income', () => {
    fc.assert(
      fc.property(
        validCommerceArb,
        validPopulationArb,
        fc.option(validAttributeArb, { nil: null }),
        (commerce, population, governorPol) => {
          const result = calculateMonthlyIncome(commerce, population, governorPol);
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: sanguo-190, Property 3: 粮食收入公式正确性**
 * *For any* 城市状态（农业值、人口、太守政治值），七月粮食收入必须等于
 * `(农业值 × 10 + 人口 ÷ 200) × (太守政治 ÷ 100 + 0.5)`。
 * **Validates: Requirements 5.2**
 */
describe('Property 3: 粮食收入公式正确性', () => {
  it('should calculate yearly grain correctly for any valid inputs', () => {
    fc.assert(
      fc.property(
        validAgricultureArb,
        validPopulationArb,
        validAttributeArb,
        (agriculture, population, governorPol) => {
          const result = calculateYearlyGrain(agriculture, population, governorPol);
          const expectedBase = agriculture * 10 + population / 200;
          const expectedBonus = governorPol / 100 + 0.5;
          const expected = Math.floor(expectedBase * expectedBonus);
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use default bonus (0.5) when no governor', () => {
    fc.assert(
      fc.property(validAgricultureArb, validPopulationArb, (agriculture, population) => {
        const result = calculateYearlyGrain(agriculture, population, null);
        const expectedBase = agriculture * 10 + population / 200;
        const expected = Math.floor(expectedBase * 0.5);
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('should always return non-negative grain', () => {
    fc.assert(
      fc.property(
        validAgricultureArb,
        validPopulationArb,
        fc.option(validAttributeArb, { nil: null }),
        (agriculture, population, governorPol) => {
          const result = calculateYearlyGrain(agriculture, population, governorPol);
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: sanguo-190, Property 4: 开发指令效果**
 * *For any* 开发指令执行，金钱必须减少100，目标值增长必须在
 * `[执行武将政治 ÷ 5 + 1, 执行武将政治 ÷ 5 + 5]` 范围内。
 * **Validates: Requirements 5.3**
 */
describe('Property 4: 开发指令效果', () => {
  it('should calculate development increase within correct range', () => {
    fc.assert(
      fc.property(validAttributeArb, validRandomArb, (executorPol, randomValue) => {
        const result = calculateDevelopmentIncrease(executorPol, randomValue);
        const baseIncrease = Math.floor(executorPol / 5);
        const minExpected = baseIncrease + 1;
        const maxExpected = baseIncrease + 5;
        expect(result).toBeGreaterThanOrEqual(minExpected);
        expect(result).toBeLessThanOrEqual(maxExpected);
      }),
      { numRuns: 100 }
    );
  });

  it('should deduct exactly 100 gold when executing development', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: DEVELOPMENT_GOLD_COST, max: 1000000 }), // 足够的金钱
        fc.integer({ min: 0, max: COMMERCE_MAX - 100 }), // 留有增长空间
        validAttributeArb,
        validRandomArb,
        (currentGold, currentValue, executorPol, randomValue) => {
          const result = executeDevelopment(
            currentGold,
            currentValue,
            executorPol,
            COMMERCE_MAX,
            randomValue
          );
          expect(result.success).toBe(true);
          expect(result.goldSpent).toBe(DEVELOPMENT_GOLD_COST);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should increase value within expected range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: DEVELOPMENT_GOLD_COST, max: 1000000 }),
        fc.integer({ min: 0, max: COMMERCE_MAX - 100 }),
        validAttributeArb,
        validRandomArb,
        (currentGold, currentValue, executorPol, randomValue) => {
          const result = executeDevelopment(
            currentGold,
            currentValue,
            executorPol,
            COMMERCE_MAX,
            randomValue
          );
          const baseIncrease = Math.floor(executorPol / 5);
          const expectedIncrease = baseIncrease + randomValue;
          expect(result.success).toBe(true);
          expect(result.valueIncrease).toBe(expectedIncrease);
          expect(result.newValue).toBe(currentValue + expectedIncrease);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should fail when gold is insufficient', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: DEVELOPMENT_GOLD_COST - 1 }), // 不足的金钱
        validCommerceArb,
        validAttributeArb,
        (currentGold, currentValue, executorPol) => {
          const result = executeDevelopment(currentGold, currentValue, executorPol);
          expect(result.success).toBe(false);
          expect(result.goldSpent).toBe(0);
          expect(result.valueIncrease).toBe(0);
          expect(result.newValue).toBe(currentValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should cap value at maximum', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: DEVELOPMENT_GOLD_COST, max: 1000000 }),
        fc.integer({ min: COMMERCE_MAX - 5, max: COMMERCE_MAX }), // 接近最大值
        validAttributeArb,
        validRandomArb,
        (currentGold, currentValue, executorPol, randomValue) => {
          const result = executeDevelopment(
            currentGold,
            currentValue,
            executorPol,
            COMMERCE_MAX,
            randomValue
          );
          expect(result.success).toBe(true);
          expect(result.newValue).toBeLessThanOrEqual(COMMERCE_MAX);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: sanguo-190, Property 5: 征兵公式正确性**
 * *For any* 征兵指令执行（给定武将统帅和魅力值），获得士兵数必须等于
 * `统帅 × 10 + 魅力 × 5`。
 * **Validates: Requirements 5.4**
 */
describe('Property 5: 征兵公式正确性', () => {
  it('should calculate recruitment soldiers correctly', () => {
    fc.assert(
      fc.property(validAttributeArb, validAttributeArb, (lead, cha) => {
        const result = calculateRecruitmentSoldiers(lead, cha);
        const expected = lead * 10 + cha * 5;
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('should always return non-negative soldiers', () => {
    fc.assert(
      fc.property(validAttributeArb, validAttributeArb, (lead, cha) => {
        const result = calculateRecruitmentSoldiers(lead, cha);
        expect(result).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should scale linearly with lead attribute', () => {
    fc.assert(
      fc.property(
        validAttributeArb,
        validAttributeArb,
        fc.integer({ min: 1, max: 10 }),
        (lead, cha, delta) => {
          // 确保 lead + delta 不超过 100
          if (lead + delta > ATTRIBUTE_MAX) return true;
          const result1 = calculateRecruitmentSoldiers(lead, cha);
          const result2 = calculateRecruitmentSoldiers(lead + delta, cha);
          expect(result2 - result1).toBe(delta * 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should scale linearly with cha attribute', () => {
    fc.assert(
      fc.property(
        validAttributeArb,
        validAttributeArb,
        fc.integer({ min: 1, max: 10 }),
        (lead, cha, delta) => {
          // 确保 cha + delta 不超过 100
          if (cha + delta > ATTRIBUTE_MAX) return true;
          const result1 = calculateRecruitmentSoldiers(lead, cha);
          const result2 = calculateRecruitmentSoldiers(lead, cha + delta);
          expect(result2 - result1).toBe(delta * 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
