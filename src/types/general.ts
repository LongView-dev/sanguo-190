/**
 * 武将属性接口
 * 五维属性范围: 0-100
 */
export interface GeneralAttributes {
  /** 统帅 - 影响部队防御和伤害减免 */
  lead: number;
  /** 武力 - 影响攻击力和单挑 */
  war: number;
  /** 智力 - 影响防御力计算 */
  int: number;
  /** 政治 - 影响内政开发效果 */
  pol: number;
  /** 魅力 - 影响征兵和招降 */
  cha: number;
}

/**
 * 武将接口
 */
export interface General {
  /** 唯一标识符 */
  id: string;
  /** 武将姓名 */
  name: string;
  /** 所属势力ID */
  faction: string;
  /** 五维属性 */
  attributes: GeneralAttributes;
  /** 年龄 */
  age: number;
  /** 存活状态 */
  isAlive: boolean;
  /** 当前所在城市ID */
  currentCity: string;
  /** 统领兵力 */
  troops: number;
}

/**
 * 属性范围常量
 */
export const ATTRIBUTE_MIN = 0;
export const ATTRIBUTE_MAX = 100;

/**
 * 验证武将属性是否在有效范围内
 */
export function isValidAttribute(value: number): boolean {
  return value >= ATTRIBUTE_MIN && value <= ATTRIBUTE_MAX;
}

/**
 * 验证武将所有属性是否有效
 */
export function isValidGeneralAttributes(attrs: GeneralAttributes): boolean {
  return (
    isValidAttribute(attrs.lead) &&
    isValidAttribute(attrs.war) &&
    isValidAttribute(attrs.int) &&
    isValidAttribute(attrs.pol) &&
    isValidAttribute(attrs.cha)
  );
}
