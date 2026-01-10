/**
 * **Feature: sanguo-190, Property 19: LLM事件数据JSON结构完整性**
 * *For any* 游戏事件转换为LLM输入，生成的JSON必须包含所有必要字段且格式有效。
 * **Validates: Requirements 7.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  eventToJSON,
  eventsToJSON,
  validateEventJSON,
  type EventJSON,
} from './historianPrompt';
import type {
  GameEvent,
  BattleEventData,
  DomesticEventData,
  GeneralEventData,
} from '../../types';

// ============ 生成器定义 ============

// 游戏时间戳生成器
const gameTimestampArb = fc.record({
  year: fc.integer({ min: 190, max: 300 }),
  month: fc.integer({ min: 1, max: 12 }),
});

// 事件类型生成器
const eventTypeArb = fc.constantFrom(
  'battle',
  'domestic',
  'disaster',
  'general'
) as fc.Arbitrary<'battle' | 'domestic' | 'disaster' | 'general'>;

// 战斗结果生成器
const battleResultArb = fc.constantFrom('win', 'lose', 'draw') as fc.Arbitrary<
  'win' | 'lose' | 'draw'
>;

// 战斗事件数据生成器
const battleEventDataArb: fc.Arbitrary<BattleEventData> = fc.record({
  attacker: fc.string({ minLength: 1, maxLength: 20 }),
  defender: fc.string({ minLength: 1, maxLength: 20 }),
  attackerGeneral: fc.string({ minLength: 1, maxLength: 20 }),
  defenderGeneral: fc.string({ minLength: 1, maxLength: 20 }),
  result: battleResultArb,
  casualties: fc.record({
    attacker: fc.integer({ min: 0, max: 100000 }),
    defender: fc.integer({ min: 0, max: 100000 }),
  }),
  duel: fc.option(
    fc.record({
      occurred: fc.boolean(),
      winner: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
        nil: undefined,
      }),
      instantKill: fc.option(fc.boolean(), { nil: undefined }),
    }),
    { nil: undefined }
  ),
  cityCapture: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
    nil: undefined,
  }),
});

// 内政行动类型生成器
const domesticActionArb = fc.constantFrom(
  'develop_commerce',
  'develop_agriculture',
  'recruit',
  'search_talent'
) as fc.Arbitrary<
  'develop_commerce' | 'develop_agriculture' | 'recruit' | 'search_talent'
>;

// 内政事件数据生成器
const domesticEventDataArb: fc.Arbitrary<DomesticEventData> = fc.record({
  city: fc.string({ minLength: 1, maxLength: 20 }),
  action: domesticActionArb,
  executor: fc.string({ minLength: 1, maxLength: 20 }),
  value: fc.integer({ min: 0, max: 1000 }),
});

// 武将事件类型生成器
const generalEventTypeArb = fc.constantFrom(
  'death',
  'defect',
  'recruited',
  'promoted'
) as fc.Arbitrary<'death' | 'defect' | 'recruited' | 'promoted'>;

// 武将事件数据生成器
const generalEventDataArb: fc.Arbitrary<GeneralEventData> = fc.record({
  general: fc.string({ minLength: 1, maxLength: 20 }),
  event: generalEventTypeArb,
  details: fc.string({ minLength: 0, maxLength: 100 }),
});

// 根据事件类型生成对应的数据
const eventDataByTypeArb = (
  type: 'battle' | 'domestic' | 'disaster' | 'general'
): fc.Arbitrary<BattleEventData | DomesticEventData | GeneralEventData> => {
  switch (type) {
    case 'battle':
      return battleEventDataArb;
    case 'domestic':
      return domesticEventDataArb;
    case 'general':
      return generalEventDataArb;
    case 'disaster':
      // 灾害事件使用内政事件数据结构作为占位
      return domesticEventDataArb;
    default:
      return domesticEventDataArb;
  }
};

// 游戏事件生成器（类型与数据匹配）
const gameEventArb: fc.Arbitrary<GameEvent> = eventTypeArb.chain((type) =>
  fc.record({
    id: fc.uuid(),
    type: fc.constant(type),
    timestamp: gameTimestampArb,
    data: eventDataByTypeArb(type),
    narrative: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  })
);

// 战斗事件生成器
const battleEventArb: fc.Arbitrary<GameEvent> = fc.record({
  id: fc.uuid(),
  type: fc.constant('battle' as const),
  timestamp: gameTimestampArb,
  data: battleEventDataArb,
  narrative: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
});

// 内政事件生成器
const domesticEventArb: fc.Arbitrary<GameEvent> = fc.record({
  id: fc.uuid(),
  type: fc.constant('domestic' as const),
  timestamp: gameTimestampArb,
  data: domesticEventDataArb,
  narrative: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
});

// 武将事件生成器
const generalEventArb: fc.Arbitrary<GameEvent> = fc.record({
  id: fc.uuid(),
  type: fc.constant('general' as const),
  timestamp: gameTimestampArb,
  data: generalEventDataArb,
  narrative: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
});

describe('Property 19: LLM事件数据JSON结构完整性', () => {
  it('should convert any game event to valid JSON structure', () => {
    fc.assert(
      fc.property(gameEventArb, (event) => {
        const json = eventToJSON(event);

        // 验证JSON结构完整性
        expect(validateEventJSON(json)).toBe(true);

        // 验证必要字段存在
        expect(json).toHaveProperty('type');
        expect(json).toHaveProperty('timestamp');
        expect(json).toHaveProperty('data');

        // 验证类型字段
        expect(typeof json.type).toBe('string');
        expect(['battle', 'domestic', 'disaster', 'general']).toContain(
          json.type
        );

        // 验证时间戳字段
        expect(typeof json.timestamp.year).toBe('number');
        expect(typeof json.timestamp.month).toBe('number');
        expect(json.timestamp.year).toBeGreaterThanOrEqual(190);
        expect(json.timestamp.month).toBeGreaterThanOrEqual(1);
        expect(json.timestamp.month).toBeLessThanOrEqual(12);

        // 验证数据字段是对象
        expect(typeof json.data).toBe('object');
        expect(json.data).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve event type in JSON conversion', () => {
    fc.assert(
      fc.property(gameEventArb, (event) => {
        const json = eventToJSON(event);
        expect(json.type).toBe(event.type);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve timestamp in JSON conversion', () => {
    fc.assert(
      fc.property(gameEventArb, (event) => {
        const json = eventToJSON(event);
        expect(json.timestamp.year).toBe(event.timestamp.year);
        expect(json.timestamp.month).toBe(event.timestamp.month);
      }),
      { numRuns: 100 }
    );
  });

  it('should convert battle events with all required fields', () => {
    fc.assert(
      fc.property(battleEventArb, (event) => {
        const json = eventToJSON(event);
        const data = json.data as BattleEventData;

        // 验证战斗事件必要字段
        expect(data).toHaveProperty('attacker');
        expect(data).toHaveProperty('defender');
        expect(data).toHaveProperty('attackerGeneral');
        expect(data).toHaveProperty('defenderGeneral');
        expect(data).toHaveProperty('result');
        expect(data).toHaveProperty('casualties');
        expect(data.casualties).toHaveProperty('attacker');
        expect(data.casualties).toHaveProperty('defender');
      }),
      { numRuns: 100 }
    );
  });

  it('should convert domestic events with all required fields', () => {
    fc.assert(
      fc.property(domesticEventArb, (event) => {
        const json = eventToJSON(event);
        const data = json.data as DomesticEventData;

        // 验证内政事件必要字段
        expect(data).toHaveProperty('city');
        expect(data).toHaveProperty('action');
        expect(data).toHaveProperty('executor');
        expect(data).toHaveProperty('value');
      }),
      { numRuns: 100 }
    );
  });

  it('should convert general events with all required fields', () => {
    fc.assert(
      fc.property(generalEventArb, (event) => {
        const json = eventToJSON(event);
        const data = json.data as GeneralEventData;

        // 验证武将事件必要字段
        expect(data).toHaveProperty('general');
        expect(data).toHaveProperty('event');
        expect(data).toHaveProperty('details');
      }),
      { numRuns: 100 }
    );
  });

  it('should convert multiple events to valid JSON array', () => {
    fc.assert(
      fc.property(fc.array(gameEventArb, { minLength: 0, maxLength: 20 }), (events) => {
        const jsonArray = eventsToJSON(events);

        // 验证数组长度一致
        expect(jsonArray.length).toBe(events.length);

        // 验证每个元素都是有效JSON
        jsonArray.forEach((json) => {
          expect(validateEventJSON(json)).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should validate correct JSON structures', () => {
    const validJSON: EventJSON = {
      type: 'battle',
      timestamp: { year: 190, month: 1 },
      data: { attacker: 'faction1', defender: 'faction2' },
    };
    expect(validateEventJSON(validJSON)).toBe(true);
  });

  it('should reject invalid JSON structures', () => {
    // 缺少type
    expect(validateEventJSON({ timestamp: { year: 190, month: 1 }, data: {} })).toBe(false);

    // 缺少timestamp
    expect(validateEventJSON({ type: 'battle', data: {} })).toBe(false);

    // 缺少data
    expect(validateEventJSON({ type: 'battle', timestamp: { year: 190, month: 1 } })).toBe(false);

    // timestamp格式错误
    expect(validateEventJSON({ type: 'battle', timestamp: { year: 'invalid' }, data: {} })).toBe(false);

    // null值
    expect(validateEventJSON(null)).toBe(false);

    // 非对象
    expect(validateEventJSON('string')).toBe(false);
    expect(validateEventJSON(123)).toBe(false);
  });
});
