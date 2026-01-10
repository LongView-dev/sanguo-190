/**
 * 游戏事件类型
 */
export type GameEventType = 'battle' | 'domestic' | 'disaster' | 'general';

/**
 * 事件类型对应的边框颜色
 */
export const EVENT_BORDER_COLORS: Record<GameEventType, string> = {
  battle: '#ef4444', // 战争 - 红色
  domestic: '#22c55e', // 内政 - 绿色
  disaster: '#eab308', // 灾害 - 黄色
  general: '#a855f7', // 武将 - 紫色
};

/**
 * 游戏时间戳
 */
export interface GameTimestamp {
  year: number;
  month: number;
}

/**
 * 战斗事件数据
 */
export interface BattleEventData {
  /** 攻方势力ID */
  attacker: string;
  /** 守方势力ID */
  defender: string;
  /** 攻方主将ID */
  attackerGeneral: string;
  /** 守方主将ID */
  defenderGeneral: string;
  /** 战斗结果 */
  result: 'win' | 'lose' | 'draw';
  /** 双方伤亡 */
  casualties: {
    attacker: number;
    defender: number;
  };
  /** 单挑信息 */
  duel?: {
    occurred: boolean;
    winner?: string;
    instantKill?: boolean;
  };
  /** 攻占城市ID */
  cityCapture?: string;
}

/**
 * 内政行动类型
 */
export type DomesticActionType =
  | 'develop_commerce'
  | 'develop_agriculture'
  | 'recruit'
  | 'search_talent';

/**
 * 内政事件数据
 */
export interface DomesticEventData {
  /** 城市ID */
  city: string;
  /** 行动类型 */
  action: DomesticActionType;
  /** 执行武将ID */
  executor: string;
  /** 变化值 */
  value: number;
}

/**
 * 武将事件类型
 */
export type GeneralEventType = 'death' | 'defect' | 'recruited' | 'promoted';

/**
 * 武将事件数据
 */
export interface GeneralEventData {
  /** 武将ID */
  general: string;
  /** 事件类型 */
  event: GeneralEventType;
  /** 详细描述 */
  details: string;
}

/**
 * 游戏事件接口
 */
export interface GameEvent {
  /** 唯一标识符 */
  id: string;
  /** 事件类型 */
  type: GameEventType;
  /** 事件时间戳 */
  timestamp: GameTimestamp;
  /** 事件数据 */
  data: BattleEventData | DomesticEventData | GeneralEventData;
  /** LLM生成的叙事文本 */
  narrative?: string;
}
