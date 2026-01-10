import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getActionPointCost,
  hasEnoughAP,
  deductActionPoints,
  advanceMonth,
  incrementGeneralAges,
  validateAPConsumption,
  type ActionType,
} from './turnSystem';
import {
  INITIAL_ACTION_POINTS,
  AP_COST_DOMESTIC,
  AP_COST_MOVEMENT,
  AP_COST_CAMPAIGN,
} from '../types/gameState';
import type { General } from '../types/general';
import type { GameTimestamp } from '../types/events';

// 生成器定义
const validAPArb = fc.integer({ min: 0, max: 10 });
const actionTypeArb = fc.constantFrom<ActionType>('domestic', 'movement', 'campaign');
const validMonthArb = fc.integer({ min: 1, max: 12 });
const validYearArb = fc.integer({ min: 190, max: 300 });
const validAgeArb = fc.integer({ min: 15, max: 80 });

// 武将生成器
const generalArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  name: fc.string({ minLength: 1, maxLength: 10 }),
  faction: fc.string({ minLength: 1, maxLength: 10 }),
  attributes: fc.record({
    lead: fc.integer({ min: 0, max: 100 }),
    war: fc.integer({ min: 0, max: 100 }),
    int: fc.integer({ min: 0, max: 100 }),
    pol: fc.integer({ min: 0, max: 100 }),
    cha: fc.integer({ min: 0, max: 100 }),
  }),
  age: validAgeArb,
  isAlive: fc.boolean(),
  currentCity: fc.string({ minLength: 1, maxLength: 10 }),
  troops: fc.integer({ min: 0, max: 100000 }),
});

// 武将记录生成器
const generalsRecordArb = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 10 }),
  generalArb
);


/**
 * **Feature: sanguo-190, Property 11: 行动力消耗一致性**
 * *For any* 玩家行动序列，内政消耗1AP、移动消耗1AP、出征消耗2AP，且AP不能为负。
 * **Validates: Requirements 9.3, 9.4, 9.5**
 */
describe('Property 11: 行动力消耗一致性', () => {
  it('should return correct AP cost for each action type', () => {
    expect(getActionPointCost('domestic')).toBe(AP_COST_DOMESTIC);
    expect(getActionPointCost('movement')).toBe(AP_COST_MOVEMENT);
    expect(getActionPointCost('campaign')).toBe(AP_COST_CAMPAIGN);
  });

  it('domestic action should always cost 1 AP', () => {
    fc.assert(
      fc.property(validAPArb, (_currentAP) => {
        const cost = getActionPointCost('domestic');
        expect(cost).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('movement action should always cost 1 AP', () => {
    fc.assert(
      fc.property(validAPArb, (_currentAP) => {
        const cost = getActionPointCost('movement');
        expect(cost).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('campaign action should always cost 2 AP', () => {
    fc.assert(
      fc.property(validAPArb, (_currentAP) => {
        const cost = getActionPointCost('campaign');
        expect(cost).toBe(2);
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly check if enough AP for action', () => {
    fc.assert(
      fc.property(validAPArb, actionTypeArb, (currentAP, actionType) => {
        const cost = getActionPointCost(actionType);
        const hasEnough = hasEnoughAP(currentAP, actionType);
        expect(hasEnough).toBe(currentAP >= cost);
      }),
      { numRuns: 100 }
    );
  });

  it('should deduct correct AP amount when sufficient', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }), // 确保有足够AP
        actionTypeArb,
        (currentAP, actionType) => {
          const cost = getActionPointCost(actionType);
          if (currentAP >= cost) {
            const result = deductActionPoints(currentAP, actionType);
            expect(result.success).toBe(true);
            expect(result.deducted).toBe(cost);
            expect(result.remainingAP).toBe(currentAP - cost);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should fail deduction when AP insufficient', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1 }), // 不足的AP
        fc.constant<ActionType>('campaign'), // 需要2AP
        (currentAP, actionType) => {
          const result = deductActionPoints(currentAP, actionType);
          expect(result.success).toBe(false);
          expect(result.deducted).toBe(0);
          expect(result.remainingAP).toBe(currentAP);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('AP should never become negative after any action sequence', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: INITIAL_ACTION_POINTS }),
        fc.array(actionTypeArb, { minLength: 0, maxLength: 5 }),
        (initialAP, actions) => {
          const { finalAP, allValid } = validateAPConsumption(initialAP, actions);
          // 如果所有动作都有效执行，最终AP不应为负
          if (allValid) {
            expect(finalAP).toBeGreaterThanOrEqual(0);
          }
          // 无论如何，最终AP都不应为负
          expect(finalAP).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly validate action sequences', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: INITIAL_ACTION_POINTS, max: INITIAL_ACTION_POINTS }),
        fc.array(actionTypeArb, { minLength: 0, maxLength: 3 }),
        (initialAP, actions) => {
          const { finalAP, allValid } = validateAPConsumption(initialAP, actions);
          
          // 手动计算预期结果
          let expectedAP = initialAP;
          let expectedValid = true;
          for (const action of actions) {
            const cost = getActionPointCost(action);
            if (expectedAP >= cost) {
              expectedAP -= cost;
            } else {
              expectedValid = false;
              break;
            }
          }
          
          expect(allValid).toBe(expectedValid);
          if (expectedValid) {
            expect(finalAP).toBe(expectedAP);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: sanguo-190, Property 12: 回合月份递增**
 * *For any* 回合结束，月份必须递增1；若当前为12月，则年份递增1且月份重置为1。
 * **Validates: Requirements 9.10**
 */
describe('Property 12: 回合月份递增', () => {
  it('should increment month by 1 for months 1-11', () => {
    fc.assert(
      fc.property(
        validYearArb,
        fc.integer({ min: 1, max: 11 }),
        (year, month) => {
          const current: GameTimestamp = { year, month };
          const result = advanceMonth(current);
          expect(result.newDate.month).toBe(month + 1);
          expect(result.newDate.year).toBe(year);
          expect(result.yearChanged).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reset month to 1 and increment year when current month is 12', () => {
    fc.assert(
      fc.property(validYearArb, (year) => {
        const current: GameTimestamp = { year, month: 12 };
        const result = advanceMonth(current);
        expect(result.newDate.month).toBe(1);
        expect(result.newDate.year).toBe(year + 1);
        expect(result.yearChanged).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly identify January after advancing from December', () => {
    fc.assert(
      fc.property(validYearArb, (year) => {
        const current: GameTimestamp = { year, month: 12 };
        const result = advanceMonth(current);
        expect(result.isJanuary).toBe(true);
        expect(result.isJuly).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly identify July after advancing from June', () => {
    fc.assert(
      fc.property(validYearArb, (year) => {
        const current: GameTimestamp = { year, month: 6 };
        const result = advanceMonth(current);
        expect(result.isJuly).toBe(true);
        expect(result.isJanuary).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should not identify January or July for other months', () => {
    fc.assert(
      fc.property(
        validYearArb,
        fc.integer({ min: 1, max: 11 }).filter((m) => m !== 6 && m !== 12),
        (year, month) => {
          const current: GameTimestamp = { year, month };
          const result = advanceMonth(current);
          // 只有从12月推进才会是1月，只有从6月推进才会是7月
          if (month !== 12) {
            expect(result.isJanuary).toBe(false);
          }
          if (month !== 6) {
            expect(result.isJuly).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('month should always be between 1 and 12 after advance', () => {
    fc.assert(
      fc.property(validYearArb, validMonthArb, (year, month) => {
        const current: GameTimestamp = { year, month };
        const result = advanceMonth(current);
        expect(result.newDate.month).toBeGreaterThanOrEqual(1);
        expect(result.newDate.month).toBeLessThanOrEqual(12);
      }),
      { numRuns: 100 }
    );
  });

  it('year should never decrease after advance', () => {
    fc.assert(
      fc.property(validYearArb, validMonthArb, (year, month) => {
        const current: GameTimestamp = { year, month };
        const result = advanceMonth(current);
        expect(result.newDate.year).toBeGreaterThanOrEqual(year);
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: sanguo-190, Property 13: 一月武将年龄递增**
 * *For any* 进入一月的回合，所有存活武将的年龄必须递增1。
 * **Validates: Requirements 9.11**
 */
describe('Property 13: 一月武将年龄递增', () => {
  it('should increment age by 1 for all alive generals', () => {
    fc.assert(
      fc.property(generalsRecordArb, (generals) => {
        const updatedGenerals = incrementGeneralAges(generals);

        for (const [id, original] of Object.entries(generals)) {
          const updated = updatedGenerals[id];
          if (original.isAlive) {
            expect(updated.age).toBe(original.age + 1);
          } else {
            expect(updated.age).toBe(original.age);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not change age for dead generals', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }),
          generalArb.map((g) => ({ ...g, isAlive: false }))
        ),
        (generals) => {
          const updatedGenerals = incrementGeneralAges(generals);

          for (const [id, original] of Object.entries(generals)) {
            const updated = updatedGenerals[id];
            expect(updated.age).toBe(original.age);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all other general properties', () => {
    fc.assert(
      fc.property(generalsRecordArb, (generals) => {
        const updatedGenerals = incrementGeneralAges(generals);

        for (const [id, original] of Object.entries(generals)) {
          const updated = updatedGenerals[id];
          expect(updated.id).toBe(original.id);
          expect(updated.name).toBe(original.name);
          expect(updated.faction).toBe(original.faction);
          expect(updated.attributes).toEqual(original.attributes);
          expect(updated.isAlive).toBe(original.isAlive);
          expect(updated.currentCity).toBe(original.currentCity);
          expect(updated.troops).toBe(original.troops);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty generals record', () => {
    const emptyGenerals: Record<string, General> = {};
    const result = incrementGeneralAges(emptyGenerals);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('should preserve the number of generals', () => {
    fc.assert(
      fc.property(generalsRecordArb, (generals) => {
        const updatedGenerals = incrementGeneralAges(generals);
        expect(Object.keys(updatedGenerals)).toHaveLength(Object.keys(generals).length);
      }),
      { numRuns: 100 }
    );
  });

  it('age should always be positive after increment', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }),
          generalArb.map((g) => ({ ...g, age: Math.max(1, g.age), isAlive: true }))
        ),
        (generals) => {
          const updatedGenerals = incrementGeneralAges(generals);

          for (const updated of Object.values(updatedGenerals)) {
            expect(updated.age).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
