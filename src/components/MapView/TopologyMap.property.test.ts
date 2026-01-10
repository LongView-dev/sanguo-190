/**
 * 地图节点颜色属性测试
 * **Feature: sanguo-190, Property 15: 地图节点颜色与势力一致性**
 * **Validates: Requirements 2.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getCityNodeColor } from './TopologyMap';
import type { City, CityScale } from '../../types/city';
import type { Faction } from '../../types/faction';
import { FACTION_COLORS } from '../../types/faction';

// 生成器定义

/** 城市规模生成器 */
const cityScaleArb = fc.constantFrom<CityScale>('small', 'medium', 'large');

/** 有效CSS颜色生成器 */
const colorArb = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([r, g, b]) => 
  `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
);

/** 势力ID生成器 */
const factionIdArb = fc.stringMatching(/^[a-z][a-z0-9_]{2,15}$/);

/** 城市ID生成器 */
const cityIdArb = fc.stringMatching(/^[a-z][a-z0-9_]{2,15}$/);

/** 城市位置生成器 */
const positionArb = fc.record({
  x: fc.integer({ min: 0, max: 1000 }),
  y: fc.integer({ min: 0, max: 800 }),
});

/** 城市资源生成器 */
const resourcesArb = fc.record({
  population: fc.integer({ min: 1000, max: 500000 }),
  gold: fc.integer({ min: 0, max: 100000 }),
  grain: fc.integer({ min: 0, max: 200000 }),
  commerce: fc.integer({ min: 0, max: 999 }),
  agriculture: fc.integer({ min: 0, max: 999 }),
  defense: fc.integer({ min: 0, max: 100 }),
  loyalty: fc.integer({ min: 0, max: 100 }),
});

/** 势力生成器 */
const factionArb = fc.record({
  id: factionIdArb,
  name: fc.string({ minLength: 1, maxLength: 10 }),
  lordId: fc.string({ minLength: 1, maxLength: 20 }),
  color: colorArb,
  cities: fc.array(cityIdArb, { minLength: 0, maxLength: 5 }),
  generals: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
  diplomacy: fc.constant({} as Record<string, 'hostile' | 'neutral' | 'ally'>),
});

/** 城市生成器（需要势力ID） */
function cityArb(factionId: string): fc.Arbitrary<City> {
  return fc.record({
    id: cityIdArb,
    name: fc.string({ minLength: 1, maxLength: 10 }),
    faction: fc.constant(factionId),
    position: positionArb,
    scale: cityScaleArb,
    resources: resourcesArb,
    connectedCities: fc.array(cityIdArb, { minLength: 0, maxLength: 5 }),
    stationedGenerals: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
    governor: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  });
}

/** 城市和势力配对生成器 */
const cityWithFactionArb = factionArb.chain((faction) =>
  cityArb(faction.id).map((city) => ({
    city,
    faction,
    factions: { [faction.id]: faction } as Record<string, Faction>,
  }))
);

/**
 * **Feature: sanguo-190, Property 15: 地图节点颜色与势力一致性**
 * *For any* 城市节点，其渲染颜色必须与其所属势力的颜色配置一致。
 * **Validates: Requirements 2.2**
 */
describe('Property 15: 地图节点颜色与势力一致性', () => {
  /**
   * 核心属性：城市节点颜色必须与所属势力颜色一致
   */
  it('should return faction color for city node', () => {
    fc.assert(
      fc.property(cityWithFactionArb, ({ city, faction, factions }) => {
        const nodeColor = getCityNodeColor(city, factions);
        
        // 城市节点颜色必须等于其所属势力的颜色
        expect(nodeColor).toBe(faction.color);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证多势力场景下颜色映射正确性
   */
  it('should correctly map colors for multiple factions', () => {
    fc.assert(
      fc.property(
        fc.array(factionArb, { minLength: 2, maxLength: 5 }),
        (factionList) => {
          // 确保势力ID唯一
          const uniqueFactions = factionList.reduce((acc, f, idx) => {
            const uniqueId = `${f.id}_${idx}`;
            acc[uniqueId] = { ...f, id: uniqueId };
            return acc;
          }, {} as Record<string, Faction>);

          // 为每个势力创建一个城市
          for (const factionId in uniqueFactions) {
            const faction = uniqueFactions[factionId];
            const city: City = {
              id: `city_${factionId}`,
              name: `城市_${factionId}`,
              faction: factionId,
              position: { x: 100, y: 100 },
              scale: 'medium',
              resources: {
                population: 10000,
                gold: 1000,
                grain: 2000,
                commerce: 100,
                agriculture: 100,
                defense: 50,
                loyalty: 70,
              },
              connectedCities: [],
              stationedGenerals: [],
              governor: null,
            };

            const nodeColor = getCityNodeColor(city, uniqueFactions);
            expect(nodeColor).toBe(faction.color);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 验证势力不存在时返回默认颜色
   */
  it('should return default color when faction does not exist', () => {
    fc.assert(
      fc.property(cityIdArb, factionIdArb, (cityId, nonExistentFactionId) => {
        const city: City = {
          id: cityId,
          name: '测试城市',
          faction: nonExistentFactionId,
          position: { x: 100, y: 100 },
          scale: 'medium',
          resources: {
            population: 10000,
            gold: 1000,
            grain: 2000,
            commerce: 100,
            agriculture: 100,
            defense: 50,
            loyalty: 70,
          },
          connectedCities: [],
          stationedGenerals: [],
          governor: null,
        };

        // 空的势力映射
        const emptyFactions: Record<string, Faction> = {};
        const nodeColor = getCityNodeColor(city, emptyFactions);

        // 应返回默认颜色
        expect(nodeColor).toBe('#666666');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证190年剧本预设势力颜色
   */
  it('should correctly use predefined faction colors from FACTION_COLORS', () => {
    const predefinedFactions: Record<string, Faction> = {
      dongzhuo: {
        id: 'dongzhuo',
        name: '董卓',
        lordId: 'dongzhuo',
        color: FACTION_COLORS.dongzhuo,
        cities: ['luoyang'],
        generals: ['dongzhuo'],
        diplomacy: {},
      },
      caocao: {
        id: 'caocao',
        name: '曹操',
        lordId: 'caocao',
        color: FACTION_COLORS.caocao,
        cities: ['chenliu'],
        generals: ['caocao'],
        diplomacy: {},
      },
      yuanshao: {
        id: 'yuanshao',
        name: '袁绍',
        lordId: 'yuanshao',
        color: FACTION_COLORS.yuanshao,
        cities: ['ye'],
        generals: ['yuanshao'],
        diplomacy: {},
      },
      liubei: {
        id: 'liubei',
        name: '刘备',
        lordId: 'liubei',
        color: FACTION_COLORS.liubei,
        cities: ['pingyuan'],
        generals: ['liubei'],
        diplomacy: {},
      },
    };

    // 验证每个预设势力的颜色
    const testCases = [
      { factionId: 'dongzhuo', expectedColor: '#1a1a1a' },
      { factionId: 'caocao', expectedColor: '#2563eb' },
      { factionId: 'yuanshao', expectedColor: '#eab308' },
      { factionId: 'liubei', expectedColor: '#16a34a' },
    ];

    for (const { factionId, expectedColor } of testCases) {
      const city: City = {
        id: `city_${factionId}`,
        name: '测试城市',
        faction: factionId,
        position: { x: 100, y: 100 },
        scale: 'medium',
        resources: {
          population: 10000,
          gold: 1000,
          grain: 2000,
          commerce: 100,
          agriculture: 100,
          defense: 50,
          loyalty: 70,
        },
        connectedCities: [],
        stationedGenerals: [],
        governor: null,
      };

      const nodeColor = getCityNodeColor(city, predefinedFactions);
      expect(nodeColor).toBe(expectedColor);
    }
  });

  /**
   * 验证颜色格式有效性
   */
  it('should return valid CSS color format', () => {
    fc.assert(
      fc.property(cityWithFactionArb, ({ city, factions }) => {
        const nodeColor = getCityNodeColor(city, factions);

        // 验证返回的是有效的CSS颜色格式（十六进制）
        expect(nodeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 验证城市属性变化不影响颜色映射
   */
  it('should return same color regardless of city attributes', () => {
    fc.assert(
      fc.property(
        factionArb,
        resourcesArb,
        resourcesArb,
        cityScaleArb,
        cityScaleArb,
        (faction, resources1, resources2, scale1, scale2) => {
          const factions = { [faction.id]: faction };

          const city1: City = {
            id: 'city1',
            name: '城市1',
            faction: faction.id,
            position: { x: 100, y: 100 },
            scale: scale1,
            resources: resources1,
            connectedCities: [],
            stationedGenerals: [],
            governor: null,
          };

          const city2: City = {
            id: 'city2',
            name: '城市2',
            faction: faction.id,
            position: { x: 200, y: 200 },
            scale: scale2,
            resources: resources2,
            connectedCities: ['city1'],
            stationedGenerals: ['general1'],
            governor: 'general1',
          };

          const color1 = getCityNodeColor(city1, factions);
          const color2 = getCityNodeColor(city2, factions);

          // 同一势力的城市应该有相同的颜色
          expect(color1).toBe(color2);
          expect(color1).toBe(faction.color);
        }
      ),
      { numRuns: 100 }
    );
  });
});
