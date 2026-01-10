// 武将相关类型
export type { General, GeneralAttributes } from './general';
export {
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  isValidAttribute,
  isValidGeneralAttributes,
} from './general';

// 城市相关类型
export type { City, CityResources, CityPosition, CityScale } from './city';
export { COMMERCE_MAX, AGRICULTURE_MAX, DEFENSE_MAX, LOYALTY_MAX } from './city';

// 势力相关类型
export type { Faction, DiplomacyStatus } from './faction';
export { FACTION_COLORS } from './faction';

// 事件相关类型
export type {
  GameEvent,
  GameEventType,
  GameTimestamp,
  BattleEventData,
  DomesticEventData,
  DomesticActionType,
  GeneralEventData,
  GeneralEventType,
} from './events';
export { EVENT_BORDER_COLORS } from './events';

// 游戏状态相关类型
export type { GameState, GamePhase } from './gameState';
export {
  INITIAL_ACTION_POINTS,
  AP_COST_DOMESTIC,
  AP_COST_MOVEMENT,
  AP_COST_CAMPAIGN,
  INITIAL_YEAR,
  INITIAL_MONTH,
} from './gameState';
