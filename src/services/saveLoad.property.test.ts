/**
 * **Feature: sanguo-190, Property 14: 游戏状态序列化/反序列化 Round-Trip**
 * *For any* 有效的游戏状态，序列化为JSON后再反序列化，必须得到与原状态等价的对象。
 * **Validates: Requirements 11.1, 11.2, 11.3, 11.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  serializeGameState,
  deserializeGameState,
  validateGameState,
  calculateChecksum,
  SaveDataIntegrityError,
} from './saveLoad';
import type { GameState, GamePhase, General, City, Faction, GameEvent } from '../types';

// ============ 生成器定义 ============

// 游戏阶段生成器
const gamePhaseArb: fc.Arbitrary<GamePhase> = fc.constantFrom(
  'player',
  'calculation',
  'narrative'
);

// 游戏时间戳生成器
const gameTimestampArb = fc.record({
  year: fc.integer({ min: 190, max: 300 }),
  month: fc.integer({ min: 1, max: 12 }),
});

// 武将属性生成器
const generalAttributesArb = fc.record({
  lead: fc.integer({ min: 0, max: 100 }),
  war: fc.integer({ min: 0, max: 100 }),
  int: fc.integer({ min: 0, max: 100 }),
  pol: fc.integer({ min: 0, max: 100 }),
  cha: fc.integer({ min: 0, max: 100 }),
});

// 武将生成器
const generalArb = (id: string, factionId: string, cityId: string): fc.Arbitrary<General> =>
  fc.record({
    id: fc.constant(id),
    name: fc.string({ minLength: 1, maxLength: 10 }),
    faction: fc.constant(factionId),
    attributes: generalAttributesArb,
    age: fc.integer({ min: 16, max: 80 }),
    isAlive: fc.boolean(),
    currentCity: fc.constant(cityId),
    troops: fc.integer({ min: 0, max: 100000 }),
  });

// 城市资源生成器
const cityResourcesArb = fc.record({
  population: fc.integer({ min: 1000, max: 500000 }),
  gold: fc.integer({ min: 0, max: 1000000 }),
  grain: fc.integer({ min: 0, max: 1000000 }),
  commerce: fc.integer({ min: 0, max: 999 }),
  agriculture: fc.integer({ min: 0, max: 999 }),
  defense: fc.integer({ min: 0, max: 100 }),
  loyalty: fc.integer({ min: 0, max: 100 }),
});


// 城市位置生成器
const cityPositionArb = fc.record({
  x: fc.integer({ min: 0, max: 1000 }),
  y: fc.integer({ min: 0, max: 1000 }),
});

// 城市规模生成器
const cityScaleArb = fc.constantFrom('small', 'medium', 'large') as fc.Arbitrary<
  'small' | 'medium' | 'large'
>;

// 城市生成器
const cityArb = (
  id: string,
  factionId: string,
  connectedCities: string[],
  stationedGenerals: string[],
  governor: string | null
): fc.Arbitrary<City> =>
  fc.record({
    id: fc.constant(id),
    name: fc.string({ minLength: 1, maxLength: 10 }),
    faction: fc.constant(factionId),
    position: cityPositionArb,
    scale: cityScaleArb,
    resources: cityResourcesArb,
    connectedCities: fc.constant(connectedCities),
    stationedGenerals: fc.constant(stationedGenerals),
    governor: fc.constant(governor),
  });

// 外交状态生成器
const diplomacyStatusArb = fc.constantFrom('hostile', 'neutral', 'ally') as fc.Arbitrary<
  'hostile' | 'neutral' | 'ally'
>;

// 颜色生成器
const colorArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  )
  .map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);

// 势力生成器
const factionArb = (
  id: string,
  lordId: string,
  cities: string[],
  generals: string[],
  otherFactionIds: string[]
): fc.Arbitrary<Faction> =>
  fc
    .record({
      id: fc.constant(id),
      name: fc.string({ minLength: 1, maxLength: 10 }),
      lordId: fc.constant(lordId),
      color: colorArb,
      cities: fc.constant(cities),
      generals: fc.constant(generals),
    })
    .chain((faction) =>
      fc
        .array(diplomacyStatusArb, {
          minLength: otherFactionIds.length,
          maxLength: otherFactionIds.length,
        })
        .map((statuses) => ({
          ...faction,
          diplomacy: Object.fromEntries(
            otherFactionIds.map((fid, i) => [fid, statuses[i]])
          ) as Record<string, 'hostile' | 'neutral' | 'ally'>,
        }))
    );

// 事件类型生成器
const eventTypeArb = fc.constantFrom('battle', 'domestic', 'disaster', 'general') as fc.Arbitrary<
  'battle' | 'domestic' | 'disaster' | 'general'
>;

// 简化的事件数据生成器
const eventDataArb = fc.record({
  city: fc.string({ minLength: 1, maxLength: 10 }),
  action: fc.constantFrom(
    'develop_commerce',
    'develop_agriculture',
    'recruit',
    'search_talent'
  ),
  executor: fc.string({ minLength: 1, maxLength: 10 }),
  value: fc.integer({ min: 0, max: 1000 }),
});

// 游戏事件生成器
const gameEventArb: fc.Arbitrary<GameEvent> = fc.record({
  id: fc.uuid(),
  type: eventTypeArb,
  timestamp: gameTimestampArb,
  data: eventDataArb,
  narrative: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
});


/**
 * 生成完整的游戏状态
 * 确保所有引用关系一致
 */
const gameStateArb: fc.Arbitrary<GameState> = fc
  .record({
    numFactions: fc.integer({ min: 1, max: 4 }),
    numCitiesPerFaction: fc.integer({ min: 1, max: 3 }),
    numGeneralsPerFaction: fc.integer({ min: 1, max: 5 }),
    numEvents: fc.integer({ min: 0, max: 10 }),
  })
  .chain(({ numFactions, numCitiesPerFaction, numGeneralsPerFaction, numEvents }) => {
    // 生成ID
    const factionIds = Array.from({ length: numFactions }, (_, i) => `faction_${i}`);
    const cityIds: string[][] = factionIds.map((_, fi) =>
      Array.from({ length: numCitiesPerFaction }, (_, ci) => `city_${fi}_${ci}`)
    );
    const generalIds: string[][] = factionIds.map((_, fi) =>
      Array.from({ length: numGeneralsPerFaction }, (_, gi) => `general_${fi}_${gi}`)
    );

    // 生成武将
    const generalsArb = fc.tuple(
      ...factionIds.flatMap((fid, fi) =>
        generalIds[fi].map((gid, gi) =>
          generalArb(gid, fid, cityIds[fi][gi % numCitiesPerFaction])
        )
      )
    );

    // 生成城市
    const citiesArb = fc.tuple(
      ...factionIds.flatMap((fid, fi) =>
        cityIds[fi].map((cid, ci) => {
          // 连接到同势力的其他城市
          const connected = cityIds[fi].filter((_, i) => i !== ci);
          // 驻守武将
          const stationed = generalIds[fi].filter(
            (_, gi) => gi % numCitiesPerFaction === ci
          );
          // 太守是第一个驻守武将
          const governor = stationed.length > 0 ? stationed[0] : null;
          return cityArb(cid, fid, connected, stationed, governor);
        })
      )
    );

    // 生成势力
    const factionsArb = fc.tuple(
      ...factionIds.map((fid, fi) => {
        const otherFactions = factionIds.filter((_, i) => i !== fi);
        return factionArb(fid, generalIds[fi][0], cityIds[fi], generalIds[fi], otherFactions);
      })
    );

    // 生成事件
    const eventsArb = fc.array(gameEventArb, { minLength: numEvents, maxLength: numEvents });

    return fc
      .tuple(generalsArb, citiesArb, factionsArb, eventsArb, gameTimestampArb, gamePhaseArb)
      .map(([generals, cities, factions, events, currentDate, phase]) => {
        const state: GameState = {
          currentDate,
          currentFaction: factionIds[0],
          actionPoints: 3,
          phase,
          factions: Object.fromEntries(factions.map((f) => [f.id, f])),
          cities: Object.fromEntries(cities.map((c) => [c.id, c])),
          generals: Object.fromEntries(generals.map((g) => [g.id, g])),
          selectedCity: null,
          eventLog: events,
        };
        return state;
      });
  });

describe('Property 14: 游戏状态序列化/反序列化 Round-Trip', () => {
  it('should preserve game state after serialize then deserialize', () => {
    fc.assert(
      fc.property(gameStateArb, (originalState) => {
        // 序列化
        const serialized = serializeGameState(originalState);

        // 反序列化
        const restored = deserializeGameState(serialized);

        // 验证等价性
        expect(restored).toEqual(originalState);
      }),
      { numRuns: 100 }
    );
  });

  it('should validate all generated game states', () => {
    fc.assert(
      fc.property(gameStateArb, (state) => {
        expect(validateGameState(state)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should produce consistent checksums for same data', () => {
    fc.assert(
      fc.property(fc.string(), (data) => {
        const checksum1 = calculateChecksum(data);
        const checksum2 = calculateChecksum(data);
        expect(checksum1).toBe(checksum2);
      }),
      { numRuns: 100 }
    );
  });

  it('should detect data corruption', () => {
    fc.assert(
      fc.property(gameStateArb, (originalState) => {
        const serialized = serializeGameState(originalState);

        // 篡改校验和
        const corrupted = {
          ...serialized,
          checksum: 'corrupted',
        };

        expect(() => deserializeGameState(corrupted)).toThrow(SaveDataIntegrityError);
      }),
      { numRuns: 50 }
    );
  });

  it('should reject invalid game state structures', () => {
    // 测试各种无效状态
    expect(validateGameState(null)).toBe(false);
    expect(validateGameState(undefined)).toBe(false);
    expect(validateGameState({})).toBe(false);
    expect(validateGameState({ currentDate: { year: 190, month: 1 } })).toBe(false);
    expect(
      validateGameState({
        currentDate: { year: 190, month: 13 }, // 无效月份
        currentFaction: 'test',
        actionPoints: 3,
        phase: 'player',
        factions: {},
        cities: {},
        generals: {},
        selectedCity: null,
        eventLog: [],
      })
    ).toBe(false);
  });
});
