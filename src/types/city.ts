/**
 * 城市规模枚举
 */
export type CityScale = 'small' | 'medium' | 'large';

/**
 * 城市资源接口
 */
export interface CityResources {
  /** 人口数量 */
  population: number;
  /** 金钱储备 */
  gold: number;
  /** 粮草储备 */
  grain: number;
  /** 商业值 (0-999) */
  commerce: number;
  /** 农业值 (0-999) */
  agriculture: number;
  /** 防御度 (0-100) */
  defense: number;
  /** 民忠 (0-100) */
  loyalty: number;
}

/**
 * 城市位置接口
 */
export interface CityPosition {
  x: number;
  y: number;
}

/**
 * 城市接口
 */
export interface City {
  /** 唯一标识符 */
  id: string;
  /** 城市名称 */
  name: string;
  /** 所属势力ID */
  faction: string;
  /** 地图坐标 */
  position: CityPosition;
  /** 城市规模 */
  scale: CityScale;
  /** 城市资源 */
  resources: CityResources;
  /** 相邻城市ID列表 */
  connectedCities: string[];
  /** 驻守武将ID列表 */
  stationedGenerals: string[];
  /** 太守ID (可为空) */
  governor: string | null;
}

/**
 * 城市资源范围常量
 */
export const COMMERCE_MAX = 999;
export const AGRICULTURE_MAX = 999;
export const DEFENSE_MAX = 100;
export const LOYALTY_MAX = 100;
