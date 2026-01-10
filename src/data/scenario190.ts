/**
 * 190年剧本初始数据
 * 公元190年，关东联军讨伐董卓
 */

import type { Faction, City, General } from '../types';
import { FACTION_COLORS } from '../types';

/**
 * 剧本数据接口
 */
export interface ScenarioData {
  id: string;
  name: string;
  description: string;
  year: number;
  month: number;
  factions: Faction[];
  cities: City[];
  generals: General[];
}

/**
 * 190年剧本 - 势力数据
 */
export const FACTIONS_190: Faction[] = [
  {
    id: 'dongzhuo',
    name: '董卓',
    lordId: 'dongzhuo',
    color: FACTION_COLORS.dongzhuo,
    cities: ['luoyang', 'changan'],
    generals: ['dongzhuo', 'lvbu', 'liru', 'huaxiong', 'lijue', 'guosi'],
    diplomacy: {
      caocao: 'hostile',
      yuanshao: 'hostile',
      liubei: 'hostile',
    },
  },
  {
    id: 'caocao',
    name: '曹操',
    lordId: 'caocao',
    color: FACTION_COLORS.caocao,
    cities: ['chenliu'],
    generals: ['caocao', 'xiaohoudun', 'xiahouyuan', 'caoren', 'caohong'],
    diplomacy: {
      dongzhuo: 'hostile',
      yuanshao: 'neutral',
      liubei: 'neutral',
    },
  },
  {
    id: 'yuanshao',
    name: '袁绍',
    lordId: 'yuanshao',
    color: FACTION_COLORS.yuanshao,
    cities: ['nanpi', 'ye'],
    generals: ['yuanshao', 'yanliang', 'wenchou', 'jushou', 'tianfeng'],
    diplomacy: {
      dongzhuo: 'hostile',
      caocao: 'neutral',
      liubei: 'neutral',
    },
  },
  {
    id: 'liubei',
    name: '刘备',
    lordId: 'liubei',
    color: FACTION_COLORS.liubei,
    cities: ['pingyuan'],
    generals: ['liubei', 'guanyu', 'zhangfei'],
    diplomacy: {
      dongzhuo: 'hostile',
      caocao: 'neutral',
      yuanshao: 'neutral',
    },
  },
];

/**
 * 190年剧本 - 城市数据
 */
export const CITIES_190: City[] = [
  // 董卓势力城市
  {
    id: 'luoyang',
    name: '洛阳',
    faction: 'dongzhuo',
    position: { x: 400, y: 300 },
    scale: 'large',
    resources: {
      population: 300000,
      gold: 50000,
      grain: 100000,
      commerce: 500,
      agriculture: 400,
      defense: 80,
      loyalty: 60,
    },
    connectedCities: ['changan', 'chenliu', 'ye'],
    stationedGenerals: ['dongzhuo', 'lvbu', 'liru'],
    governor: 'dongzhuo',
  },
  {
    id: 'changan',
    name: '长安',
    faction: 'dongzhuo',
    position: { x: 200, y: 350 },
    scale: 'large',
    resources: {
      population: 250000,
      gold: 40000,
      grain: 80000,
      commerce: 450,
      agriculture: 500,
      defense: 70,
      loyalty: 55,
    },
    connectedCities: ['luoyang'],
    stationedGenerals: ['huaxiong', 'lijue', 'guosi'],
    governor: 'huaxiong',
  },
  // 曹操势力城市
  {
    id: 'chenliu',
    name: '陈留',
    faction: 'caocao',
    position: { x: 500, y: 350 },
    scale: 'medium',
    resources: {
      population: 100000,
      gold: 15000,
      grain: 30000,
      commerce: 200,
      agriculture: 250,
      defense: 40,
      loyalty: 75,
    },
    connectedCities: ['luoyang', 'pingyuan'],
    stationedGenerals: ['caocao', 'xiaohoudun', 'xiahouyuan', 'caoren', 'caohong'],
    governor: 'caocao',
  },
  // 袁绍势力城市
  {
    id: 'nanpi',
    name: '南皮',
    faction: 'yuanshao',
    position: { x: 550, y: 200 },
    scale: 'medium',
    resources: {
      population: 120000,
      gold: 20000,
      grain: 40000,
      commerce: 300,
      agriculture: 350,
      defense: 50,
      loyalty: 70,
    },
    connectedCities: ['ye', 'pingyuan'],
    stationedGenerals: ['yanliang', 'wenchou'],
    governor: 'yanliang',
  },
  {
    id: 'ye',
    name: '邺',
    faction: 'yuanshao',
    position: { x: 480, y: 220 },
    scale: 'large',
    resources: {
      population: 180000,
      gold: 30000,
      grain: 60000,
      commerce: 400,
      agriculture: 450,
      defense: 60,
      loyalty: 72,
    },
    connectedCities: ['nanpi', 'luoyang'],
    stationedGenerals: ['yuanshao', 'jushou', 'tianfeng'],
    governor: 'yuanshao',
  },
  // 刘备势力城市
  {
    id: 'pingyuan',
    name: '平原',
    faction: 'liubei',
    position: { x: 600, y: 280 },
    scale: 'small',
    resources: {
      population: 50000,
      gold: 5000,
      grain: 10000,
      commerce: 100,
      agriculture: 150,
      defense: 30,
      loyalty: 85,
    },
    connectedCities: ['nanpi', 'chenliu'],
    stationedGenerals: ['liubei', 'guanyu', 'zhangfei'],
    governor: 'liubei',
  },
];


/**
 * 190年剧本 - 武将数据
 */
export const GENERALS_190: General[] = [
  // ========== 董卓势力武将 ==========
  {
    id: 'dongzhuo',
    name: '董卓',
    faction: 'dongzhuo',
    attributes: { lead: 70, war: 75, int: 55, pol: 30, cha: 20 },
    age: 52,
    isAlive: true,
    currentCity: 'luoyang',
    troops: 30000,
  },
  {
    id: 'lvbu',
    name: '吕布',
    faction: 'dongzhuo',
    attributes: { lead: 90, war: 100, int: 25, pol: 15, cha: 40 },
    age: 29,
    isAlive: true,
    currentCity: 'luoyang',
    troops: 20000,
  },
  {
    id: 'liru',
    name: '李儒',
    faction: 'dongzhuo',
    attributes: { lead: 45, war: 30, int: 92, pol: 85, cha: 35 },
    age: 38,
    isAlive: true,
    currentCity: 'luoyang',
    troops: 5000,
  },
  {
    id: 'huaxiong',
    name: '华雄',
    faction: 'dongzhuo',
    attributes: { lead: 75, war: 90, int: 35, pol: 20, cha: 30 },
    age: 35,
    isAlive: true,
    currentCity: 'changan',
    troops: 15000,
  },
  {
    id: 'lijue',
    name: '李傕',
    faction: 'dongzhuo',
    attributes: { lead: 65, war: 78, int: 40, pol: 25, cha: 25 },
    age: 32,
    isAlive: true,
    currentCity: 'changan',
    troops: 12000,
  },
  {
    id: 'guosi',
    name: '郭汜',
    faction: 'dongzhuo',
    attributes: { lead: 62, war: 76, int: 38, pol: 22, cha: 23 },
    age: 30,
    isAlive: true,
    currentCity: 'changan',
    troops: 10000,
  },

  // ========== 曹操势力武将 ==========
  {
    id: 'caocao',
    name: '曹操',
    faction: 'caocao',
    attributes: { lead: 96, war: 72, int: 91, pol: 94, cha: 96 },
    age: 35,
    isAlive: true,
    currentCity: 'chenliu',
    troops: 8000,
  },
  {
    id: 'xiaohoudun',
    name: '夏侯惇',
    faction: 'caocao',
    attributes: { lead: 80, war: 85, int: 50, pol: 45, cha: 70 },
    age: 33,
    isAlive: true,
    currentCity: 'chenliu',
    troops: 5000,
  },
  {
    id: 'xiahouyuan',
    name: '夏侯渊',
    faction: 'caocao',
    attributes: { lead: 85, war: 88, int: 55, pol: 40, cha: 65 },
    age: 31,
    isAlive: true,
    currentCity: 'chenliu',
    troops: 5000,
  },
  {
    id: 'caoren',
    name: '曹仁',
    faction: 'caocao',
    attributes: { lead: 92, war: 80, int: 60, pol: 55, cha: 75 },
    age: 22,
    isAlive: true,
    currentCity: 'chenliu',
    troops: 4000,
  },
  {
    id: 'caohong',
    name: '曹洪',
    faction: 'caocao',
    attributes: { lead: 75, war: 78, int: 45, pol: 42, cha: 60 },
    age: 21,
    isAlive: true,
    currentCity: 'chenliu',
    troops: 3000,
  },

  // ========== 袁绍势力武将 ==========
  {
    id: 'yuanshao',
    name: '袁绍',
    faction: 'yuanshao',
    attributes: { lead: 75, war: 55, int: 65, pol: 70, cha: 85 },
    age: 36,
    isAlive: true,
    currentCity: 'ye',
    troops: 15000,
  },
  {
    id: 'yanliang',
    name: '颜良',
    faction: 'yuanshao',
    attributes: { lead: 70, war: 95, int: 30, pol: 25, cha: 45 },
    age: 32,
    isAlive: true,
    currentCity: 'nanpi',
    troops: 8000,
  },
  {
    id: 'wenchou',
    name: '文丑',
    faction: 'yuanshao',
    attributes: { lead: 68, war: 93, int: 28, pol: 22, cha: 42 },
    age: 31,
    isAlive: true,
    currentCity: 'nanpi',
    troops: 7000,
  },
  {
    id: 'jushou',
    name: '沮授',
    faction: 'yuanshao',
    attributes: { lead: 72, war: 45, int: 90, pol: 88, cha: 75 },
    age: 40,
    isAlive: true,
    currentCity: 'ye',
    troops: 3000,
  },
  {
    id: 'tianfeng',
    name: '田丰',
    faction: 'yuanshao',
    attributes: { lead: 65, war: 40, int: 92, pol: 90, cha: 70 },
    age: 42,
    isAlive: true,
    currentCity: 'ye',
    troops: 2000,
  },

  // ========== 刘备势力武将 ==========
  {
    id: 'liubei',
    name: '刘备',
    faction: 'liubei',
    attributes: { lead: 78, war: 65, int: 70, pol: 75, cha: 99 },
    age: 29,
    isAlive: true,
    currentCity: 'pingyuan',
    troops: 3000,
  },
  {
    id: 'guanyu',
    name: '关羽',
    faction: 'liubei',
    attributes: { lead: 88, war: 97, int: 70, pol: 60, cha: 90 },
    age: 28,
    isAlive: true,
    currentCity: 'pingyuan',
    troops: 2000,
  },
  {
    id: 'zhangfei',
    name: '张飞',
    faction: 'liubei',
    attributes: { lead: 75, war: 98, int: 35, pol: 20, cha: 55 },
    age: 23,
    isAlive: true,
    currentCity: 'pingyuan',
    troops: 1500,
  },
];

/**
 * 190年剧本完整数据
 */
export const SCENARIO_190: ScenarioData = {
  id: 'scenario_190',
  name: '群雄割据',
  description: '公元190年，关东联军讨伐董卓。董卓挟天子以令诸侯，占据洛阳、长安两大都城。曹操、袁绍、刘备等群雄并起，天下大乱。',
  year: 190,
  month: 1,
  factions: FACTIONS_190,
  cities: CITIES_190,
  generals: GENERALS_190,
};

/**
 * 将剧本数据转换为游戏状态格式
 */
export function createGameStateFromScenario(
  scenario: ScenarioData,
  _playerFactionId: string
): {
  factions: Record<string, Faction>;
  cities: Record<string, City>;
  generals: Record<string, General>;
  currentDate: { year: number; month: number };
} {
  const factions: Record<string, Faction> = {};
  const cities: Record<string, City> = {};
  const generals: Record<string, General> = {};

  scenario.factions.forEach((f) => {
    factions[f.id] = { ...f };
  });

  scenario.cities.forEach((c) => {
    cities[c.id] = { ...c };
  });

  scenario.generals.forEach((g) => {
    generals[g.id] = { ...g };
  });

  return {
    factions,
    cities,
    generals,
    currentDate: { year: scenario.year, month: scenario.month },
  };
}

/**
 * 获取所有城市ID列表
 */
export function getAllCityIds(): string[] {
  return CITIES_190.map((c) => c.id);
}

/**
 * 获取所有势力ID列表
 */
export function getAllFactionIds(): string[] {
  return FACTIONS_190.map((f) => f.id);
}

/**
 * 获取所有武将ID列表
 */
export function getAllGeneralIds(): string[] {
  return GENERALS_190.map((g) => g.id);
}

/**
 * 验证城市连接关系是否双向有效
 */
export function validateCityConnections(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const cityIds = new Set(getAllCityIds());

  for (const city of CITIES_190) {
    for (const connectedId of city.connectedCities) {
      // 检查连接的城市是否存在
      if (!cityIds.has(connectedId)) {
        errors.push(`城市 ${city.name}(${city.id}) 连接了不存在的城市: ${connectedId}`);
        continue;
      }

      // 检查连接是否双向
      const connectedCity = CITIES_190.find((c) => c.id === connectedId);
      if (connectedCity && !connectedCity.connectedCities.includes(city.id)) {
        errors.push(
          `城市连接不是双向的: ${city.name}(${city.id}) -> ${connectedCity.name}(${connectedId})`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 验证武将分配是否与势力和城市一致
 */
export function validateGeneralAssignments(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const general of GENERALS_190) {
    // 检查武将所属势力是否存在
    const faction = FACTIONS_190.find((f) => f.id === general.faction);
    if (!faction) {
      errors.push(`武将 ${general.name}(${general.id}) 所属势力不存在: ${general.faction}`);
      continue;
    }

    // 检查武将是否在势力的武将列表中
    if (!faction.generals.includes(general.id)) {
      errors.push(
        `武将 ${general.name}(${general.id}) 不在势力 ${faction.name} 的武将列表中`
      );
    }

    // 检查武将所在城市是否存在
    const city = CITIES_190.find((c) => c.id === general.currentCity);
    if (!city) {
      errors.push(`武将 ${general.name}(${general.id}) 所在城市不存在: ${general.currentCity}`);
      continue;
    }

    // 检查武将是否在城市的驻守武将列表中
    if (!city.stationedGenerals.includes(general.id)) {
      errors.push(
        `武将 ${general.name}(${general.id}) 不在城市 ${city.name} 的驻守武将列表中`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

export default SCENARIO_190;
