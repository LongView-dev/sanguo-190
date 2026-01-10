/**
 * 190年剧本数据完整性单元测试
 * Requirements: 10.1-10.6
 */

import { describe, it, expect } from 'vitest';
import {
  SCENARIO_190,
  FACTIONS_190,
  CITIES_190,
  GENERALS_190,
  validateCityConnections,
  validateGeneralAssignments,
  getAllCityIds,
  getAllFactionIds,
  getAllGeneralIds,
} from './scenario190';
import { isValidGeneralAttributes } from '../types';

describe('190年剧本数据完整性', () => {
  describe('势力数据验证 (Requirements 10.1-10.6)', () => {
    it('应包含董卓势力，控制洛阳和长安', () => {
      const dongzhuo = FACTIONS_190.find((f) => f.id === 'dongzhuo');
      expect(dongzhuo).toBeDefined();
      expect(dongzhuo!.name).toBe('董卓');
      expect(dongzhuo!.cities).toContain('luoyang');
      expect(dongzhuo!.cities).toContain('changan');
    });

    it('应包含曹操势力，控制陈留', () => {
      const caocao = FACTIONS_190.find((f) => f.id === 'caocao');
      expect(caocao).toBeDefined();
      expect(caocao!.name).toBe('曹操');
      expect(caocao!.cities).toContain('chenliu');
    });

    it('应包含袁绍势力，控制南皮和邺', () => {
      const yuanshao = FACTIONS_190.find((f) => f.id === 'yuanshao');
      expect(yuanshao).toBeDefined();
      expect(yuanshao!.name).toBe('袁绍');
      expect(yuanshao!.cities).toContain('nanpi');
      expect(yuanshao!.cities).toContain('ye');
    });

    it('应包含刘备势力，控制平原', () => {
      const liubei = FACTIONS_190.find((f) => f.id === 'liubei');
      expect(liubei).toBeDefined();
      expect(liubei!.name).toBe('刘备');
      expect(liubei!.cities).toContain('pingyuan');
    });

    it('所有势力对董卓应为敌对状态', () => {
      const nonDongzhuoFactions = FACTIONS_190.filter((f) => f.id !== 'dongzhuo');
      for (const faction of nonDongzhuoFactions) {
        expect(faction.diplomacy['dongzhuo']).toBe('hostile');
      }
    });

    it('每个势力应有唯一ID', () => {
      const ids = FACTIONS_190.map((f) => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('每个势力应有君主ID', () => {
      for (const faction of FACTIONS_190) {
        expect(faction.lordId).toBeDefined();
        expect(faction.lordId.length).toBeGreaterThan(0);
      }
    });
  });

  describe('城市数据验证', () => {
    it('董卓势力城市应有高兵力和粮草', () => {
      const luoyang = CITIES_190.find((c) => c.id === 'luoyang');
      const changan = CITIES_190.find((c) => c.id === 'changan');
      
      expect(luoyang).toBeDefined();
      expect(changan).toBeDefined();
      expect(luoyang!.resources.grain).toBeGreaterThan(50000);
      expect(changan!.resources.grain).toBeGreaterThan(50000);
    });

    it('曹操势力城市应有中等资源', () => {
      const chenliu = CITIES_190.find((c) => c.id === 'chenliu');
      expect(chenliu).toBeDefined();
      expect(chenliu!.resources.gold).toBeGreaterThan(10000);
      expect(chenliu!.resources.gold).toBeLessThan(50000);
    });

    it('袁绍势力城市应有高人口', () => {
      const nanpi = CITIES_190.find((c) => c.id === 'nanpi');
      const ye = CITIES_190.find((c) => c.id === 'ye');
      
      expect(nanpi).toBeDefined();
      expect(ye).toBeDefined();
      expect(nanpi!.resources.population + ye!.resources.population).toBeGreaterThan(200000);
    });

    it('刘备势力城市应有最少资源', () => {
      const pingyuan = CITIES_190.find((c) => c.id === 'pingyuan');
      expect(pingyuan).toBeDefined();
      expect(pingyuan!.resources.gold).toBeLessThan(10000);
      expect(pingyuan!.resources.grain).toBeLessThan(20000);
    });

    it('每个城市应有唯一ID', () => {
      const ids = CITIES_190.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('每个城市应有有效的规模', () => {
      const validScales = ['small', 'medium', 'large'];
      for (const city of CITIES_190) {
        expect(validScales).toContain(city.scale);
      }
    });

    it('每个城市资源值应在有效范围内', () => {
      for (const city of CITIES_190) {
        expect(city.resources.commerce).toBeGreaterThanOrEqual(0);
        expect(city.resources.commerce).toBeLessThanOrEqual(999);
        expect(city.resources.agriculture).toBeGreaterThanOrEqual(0);
        expect(city.resources.agriculture).toBeLessThanOrEqual(999);
        expect(city.resources.defense).toBeGreaterThanOrEqual(0);
        expect(city.resources.defense).toBeLessThanOrEqual(100);
        expect(city.resources.loyalty).toBeGreaterThanOrEqual(0);
        expect(city.resources.loyalty).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('城市连接关系验证', () => {
    it('城市连接应双向有效', () => {
      const result = validateCityConnections();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('所有连接的城市ID应存在', () => {
      const cityIds = new Set(getAllCityIds());
      for (const city of CITIES_190) {
        for (const connectedId of city.connectedCities) {
          expect(cityIds.has(connectedId)).toBe(true);
        }
      }
    });

    it('洛阳应连接长安、陈留、邺', () => {
      const luoyang = CITIES_190.find((c) => c.id === 'luoyang');
      expect(luoyang).toBeDefined();
      expect(luoyang!.connectedCities).toContain('changan');
      expect(luoyang!.connectedCities).toContain('chenliu');
      expect(luoyang!.connectedCities).toContain('ye');
    });
  });

  describe('武将数据验证', () => {
    it('每个武将应有唯一ID', () => {
      const ids = GENERALS_190.map((g) => g.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('所有武将属性应在0-100范围内', () => {
      for (const general of GENERALS_190) {
        expect(isValidGeneralAttributes(general.attributes)).toBe(true);
      }
    });

    it('武将分配应与势力和城市一致', () => {
      const result = validateGeneralAssignments();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('吕布应有最高武力值(100)', () => {
      const lvbu = GENERALS_190.find((g) => g.id === 'lvbu');
      expect(lvbu).toBeDefined();
      expect(lvbu!.attributes.war).toBe(100);
    });

    it('关羽和张飞应属于刘备势力', () => {
      const guanyu = GENERALS_190.find((g) => g.id === 'guanyu');
      const zhangfei = GENERALS_190.find((g) => g.id === 'zhangfei');
      
      expect(guanyu).toBeDefined();
      expect(zhangfei).toBeDefined();
      expect(guanyu!.faction).toBe('liubei');
      expect(zhangfei!.faction).toBe('liubei');
    });

    it('曹操应有高统帅值(>=90)', () => {
      const caocao = GENERALS_190.find((g) => g.id === 'caocao');
      expect(caocao).toBeDefined();
      expect(caocao!.attributes.lead).toBeGreaterThanOrEqual(90);
    });

    it('每个势力君主应存在于武将列表中', () => {
      for (const faction of FACTIONS_190) {
        const lord = GENERALS_190.find((g) => g.id === faction.lordId);
        expect(lord).toBeDefined();
        expect(lord!.faction).toBe(faction.id);
      }
    });
  });

  describe('剧本整体数据验证', () => {
    it('剧本应设置为190年1月', () => {
      expect(SCENARIO_190.year).toBe(190);
      expect(SCENARIO_190.month).toBe(1);
    });

    it('剧本应包含所有势力、城市、武将', () => {
      expect(SCENARIO_190.factions.length).toBe(4);
      expect(SCENARIO_190.cities.length).toBe(6);
      expect(SCENARIO_190.generals.length).toBeGreaterThan(15);
    });

    it('辅助函数应返回正确的ID列表', () => {
      expect(getAllFactionIds()).toHaveLength(4);
      expect(getAllCityIds()).toHaveLength(6);
      expect(getAllGeneralIds().length).toBe(GENERALS_190.length);
    });
  });
});
