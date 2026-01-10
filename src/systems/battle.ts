/**
 * 战斗系统 - 处理战斗计算、单挑和秒杀判定
 * @module systems/battle
 */

/**
 * 单挑结果接口
 */
export interface DuelResult {
  /** 是否触发单挑 */
  triggered: boolean;
  /** 是否触发秒杀 */
  instantKill: boolean;
  /** 胜利者ID (如果触发单挑) */
  winner?: string;
}

/**
 * 战斗伤害结果接口
 */
export interface DamageResult {
  /** 基础伤害值 */
  baseDamage: number;
  /** 最终伤害值（应用减免后） */
  finalDamage: number;
  /** 是否应用了高统帅减免 */
  damageReduced: boolean;
}

/**
 * 高统帅阈值 - 统帅>=90时获得伤害减免
 */
export const HIGH_LEAD_THRESHOLD = 90;

/**
 * 高统帅伤害减免系数
 */
export const HIGH_LEAD_DAMAGE_REDUCTION = 0.8;

/**
 * 单挑触发概率 (武力差<=10时)
 */
export const DUEL_TRIGGER_PROBABILITY = 0.05;

/**
 * 秒杀触发概率 (武力差>20时)
 */
export const INSTANT_KILL_PROBABILITY = 0.01;

/**
 * 单挑触发的武力差阈值
 */
export const DUEL_WAR_DIFF_THRESHOLD = 10;

/**
 * 秒杀触发的武力差阈值
 */
export const INSTANT_KILL_WAR_DIFF_THRESHOLD = 20;

/**
 * 伤害随机浮动最小值
 */
export const DAMAGE_RANDOM_MIN = 0.9;

/**
 * 伤害随机浮动最大值
 */
export const DAMAGE_RANDOM_MAX = 1.1;

/**
 * 计算攻击力
 * 公式: 兵力 × (武力 × 0.4 + 统帅 × 0.6) ÷ 100
 * **Validates: Requirements 6.1**
 * @param troops - 兵力
 * @param war - 武力值 (0-100)
 * @param lead - 统帅值 (0-100)
 * @returns 攻击力
 */
export function calculateAttackPower(
  troops: number,
  war: number,
  lead: number
): number {
  return (troops * (war * 0.4 + lead * 0.6)) / 100;
}

/**
 * 计算防御力
 * 公式: 兵力 × (统帅 × 0.8 + 智力 × 0.2) ÷ 100 + 城市防御度
 * **Validates: Requirements 6.2**
 * @param troops - 兵力
 * @param lead - 统帅值 (0-100)
 * @param int - 智力值 (0-100)
 * @param cityDefense - 城市防御度 (0-100)
 * @returns 防御力
 */
export function calculateDefensePower(
  troops: number,
  lead: number,
  int: number,
  cityDefense: number
): number {
  return (troops * (lead * 0.8 + int * 0.2)) / 100 + cityDefense;
}

/**
 * 计算战斗伤害
 * 公式: (攻击力 ÷ 防御力) × 300 × 随机浮动(0.9~1.1)
 * **Validates: Requirements 6.3**
 * @param attackPower - 攻击力
 * @param defensePower - 防御力
 * @param randomFactor - 随机浮动因子 (0.9-1.1)，用于测试时可注入
 * @returns 伤害值
 */
export function calculateDamage(
  attackPower: number,
  defensePower: number,
  randomFactor: number = Math.random() * (DAMAGE_RANDOM_MAX - DAMAGE_RANDOM_MIN) + DAMAGE_RANDOM_MIN
): number {
  // 防止除零错误，防御力最小为1
  const effectiveDefense = Math.max(1, defensePower);
  return Math.floor((attackPower / effectiveDefense) * 300 * randomFactor);
}

/**
 * 应用高统帅伤害减免
 * 当防御方统帅>=90时，受到的伤害减少20%
 * **Validates: Requirements 4.2**
 * @param damage - 原始伤害
 * @param defenderLead - 防御方统帅值
 * @returns 伤害结果
 */
export function applyHighLeadReduction(
  damage: number,
  defenderLead: number
): DamageResult {
  if (defenderLead >= HIGH_LEAD_THRESHOLD) {
    return {
      baseDamage: damage,
      finalDamage: Math.floor(damage * HIGH_LEAD_DAMAGE_REDUCTION),
      damageReduced: true,
    };
  }
  return {
    baseDamage: damage,
    finalDamage: damage,
    damageReduced: false,
  };
}

/**
 * 检查单挑触发
 * 当两军主将武力差<=10时，有5%概率触发单挑
 * **Validates: Requirements 6.4**
 * @param attackerWar - 攻击方武力值
 * @param defenderWar - 防御方武力值
 * @param randomValue - 随机值 (0-1)，用于测试时可注入
 * @returns 是否触发单挑
 */
export function checkDuel(
  attackerWar: number,
  defenderWar: number,
  randomValue: number = Math.random()
): boolean {
  const warDiff = Math.abs(attackerWar - defenderWar);
  if (warDiff <= DUEL_WAR_DIFF_THRESHOLD) {
    return randomValue < DUEL_TRIGGER_PROBABILITY;
  }
  return false;
}

/**
 * 检查秒杀触发
 * 当两军主将武力差>20时，有1%概率触发秒杀
 * **Validates: Requirements 6.5**
 * @param attackerWar - 攻击方武力值
 * @param defenderWar - 防御方武力值
 * @param randomValue - 随机值 (0-1)，用于测试时可注入
 * @returns 是否触发秒杀
 */
export function checkInstantKill(
  attackerWar: number,
  defenderWar: number,
  randomValue: number = Math.random()
): boolean {
  const warDiff = Math.abs(attackerWar - defenderWar);
  if (warDiff > INSTANT_KILL_WAR_DIFF_THRESHOLD) {
    return randomValue < INSTANT_KILL_PROBABILITY;
  }
  return false;
}

/**
 * 确定单挑胜利者
 * 武力高者获胜，相同时随机决定
 * @param attackerWar - 攻击方武力值
 * @param defenderWar - 防御方武力值
 * @param attackerId - 攻击方ID
 * @param defenderId - 防御方ID
 * @param randomValue - 随机值 (0-1)，用于平局时决定胜者
 * @returns 胜利者ID
 */
export function determineDuelWinner(
  attackerWar: number,
  defenderWar: number,
  attackerId: string,
  defenderId: string,
  randomValue: number = Math.random()
): string {
  if (attackerWar > defenderWar) {
    return attackerId;
  } else if (defenderWar > attackerWar) {
    return defenderId;
  }
  // 武力相同时随机决定
  return randomValue < 0.5 ? attackerId : defenderId;
}

/**
 * 确定秒杀的受害者
 * 武力低者被秒杀
 * @param attackerWar - 攻击方武力值
 * @param defenderWar - 防御方武力值
 * @param attackerId - 攻击方ID
 * @param defenderId - 防御方ID
 * @returns 被秒杀者ID
 */
export function determineInstantKillVictim(
  attackerWar: number,
  defenderWar: number,
  attackerId: string,
  defenderId: string
): string {
  // 武力低者被秒杀
  return attackerWar > defenderWar ? defenderId : attackerId;
}

/**
 * 执行单挑/秒杀判定
 * 综合检查单挑和秒杀触发条件
 * @param attackerWar - 攻击方武力值
 * @param defenderWar - 防御方武力值
 * @param attackerId - 攻击方ID
 * @param defenderId - 防御方ID
 * @param duelRandom - 单挑随机值
 * @param instantKillRandom - 秒杀随机值
 * @param winnerRandom - 胜者决定随机值
 * @returns 单挑结果
 */
export function executeDuelCheck(
  attackerWar: number,
  defenderWar: number,
  attackerId: string,
  defenderId: string,
  duelRandom: number = Math.random(),
  instantKillRandom: number = Math.random(),
  winnerRandom: number = Math.random()
): DuelResult {
  // 先检查秒杀
  if (checkInstantKill(attackerWar, defenderWar, instantKillRandom)) {
    const victim = determineInstantKillVictim(
      attackerWar,
      defenderWar,
      attackerId,
      defenderId
    );
    // 秒杀时，胜者是非受害者
    const winner = victim === attackerId ? defenderId : attackerId;
    return {
      triggered: true,
      instantKill: true,
      winner,
    };
  }

  // 再检查单挑
  if (checkDuel(attackerWar, defenderWar, duelRandom)) {
    const winner = determineDuelWinner(
      attackerWar,
      defenderWar,
      attackerId,
      defenderId,
      winnerRandom
    );
    return {
      triggered: true,
      instantKill: false,
      winner,
    };
  }

  return {
    triggered: false,
    instantKill: false,
  };
}
