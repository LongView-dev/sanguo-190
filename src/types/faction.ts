/**
 * 外交关系类型
 */
export type DiplomacyStatus = 'hostile' | 'neutral' | 'ally';

/**
 * 势力接口
 */
export interface Faction {
  /** 唯一标识符 */
  id: string;
  /** 势力名称 */
  name: string;
  /** 君主武将ID */
  lordId: string;
  /** 势力颜色 (CSS颜色值) */
  color: string;
  /** 控制城市ID列表 */
  cities: string[];
  /** 所属武将ID列表 */
  generals: string[];
  /** 外交关系映射 */
  diplomacy: Record<string, DiplomacyStatus>;
}

/**
 * 190年剧本势力颜色常量
 */
export const FACTION_COLORS = {
  dongzhuo: '#1a1a1a', // 董卓 - 黑色
  caocao: '#2563eb', // 曹操 - 蓝色
  yuanshao: '#eab308', // 袁绍 - 黄色
  liubei: '#16a34a', // 刘备 - 绿色
} as const;
