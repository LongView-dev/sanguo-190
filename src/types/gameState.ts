import type { Faction } from './faction';
import type { City } from './city';
import type { General } from './general';
import type { GameEvent, GameTimestamp } from './events';

/**
 * 游戏阶段
 */
export type GamePhase = 'player' | 'calculation' | 'narrative';

/**
 * 游戏状态接口
 */
export interface GameState {
  /** 当前日期 */
  currentDate: GameTimestamp;
  /** 玩家势力ID */
  currentFaction: string;
  /** 当前行动力 */
  actionPoints: number;
  /** 当前游戏阶段 */
  phase: GamePhase;
  /** 所有势力 */
  factions: Record<string, Faction>;
  /** 所有城市 */
  cities: Record<string, City>;
  /** 所有武将 */
  generals: Record<string, General>;
  /** 当前选中城市ID */
  selectedCity: string | null;
  /** 事件日志 */
  eventLog: GameEvent[];
}

/**
 * 行动力常量
 */
export const INITIAL_ACTION_POINTS = 3;
export const AP_COST_DOMESTIC = 1;
export const AP_COST_MOVEMENT = 1;
export const AP_COST_CAMPAIGN = 2;

/**
 * 初始年份
 */
export const INITIAL_YEAR = 190;
export const INITIAL_MONTH = 1;
