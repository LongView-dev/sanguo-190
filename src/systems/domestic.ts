/**
 * 内政系统 - 处理城市资源管理和内政指令
 * @module systems/domestic
 */

import type { CityResources } from '../types/city';
import { COMMERCE_MAX } from '../types/city';

/**
 * 内政开发结果接口
 */
export interface DomesticResult {
  /** 是否成功 */
  success: boolean;
  /** 消耗的金钱 */
  goldSpent: number;
  /** 增加的数值 */
  valueIncrease: number;
  /** 新的数值 */
  newValue: number;
  /** 错误信息 */
  error?: string;
}

/**
 * 征兵结果接口
 */
export interface RecruitResult {
  /** 是否成功 */
  success: boolean;
  /** 消耗的金钱 */
  goldSpent: number;
  /** 消耗的人口 */
  populationSpent: number;
  /** 获得的士兵数 */
  soldiersGained: number;
  /** 民忠降低值 */
  loyaltyDecrease: number;
  /** 错误信息 */
  error?: string;
}

/**
 * 开发指令消耗的金钱常量
 */
export const DEVELOPMENT_GOLD_COST = 100;

/**
 * 征兵消耗常量
 */
export const RECRUITMENT_GOLD_PER_SOLDIER = 2;
export const RECRUITMENT_POPULATION_PER_SOLDIER = 1;
export const RECRUITMENT_BASE_LOYALTY_DECREASE = 5;

/**
 * 计算太守政治加成系数
 * 公式: 太守政治 ÷ 100 + 0.5
 * 无太守时使用默认加成 0.5
 * @param governorPol - 太守政治值 (0-100)，null表示无太守
 * @returns 政治加成系数
 */
export function calculatePoliticsBonus(governorPol: number | null): number {
  if (governorPol === null) {
    return 0.5; // 无太守时默认加成
  }
  return governorPol / 100 + 0.5;
}

/**
 * 计算月度金钱收入
 * 公式: (商业值 × 1.5 + 人口 ÷ 1000) × 太守政治加成
 * **Validates: Requirements 5.1**
 * @param commerce - 城市商业值
 * @param population - 城市人口
 * @param governorPol - 太守政治值 (null表示无太守)
 * @returns 月度金钱收入
 */
export function calculateMonthlyIncome(
  commerce: number,
  population: number,
  governorPol: number | null
): number {
  const baseIncome = commerce * 1.5 + population / 1000;
  const bonus = calculatePoliticsBonus(governorPol);
  return Math.floor(baseIncome * bonus);
}

/**
 * 计算年度粮食收入（七月发放）
 * 公式: (农业值 × 10 + 人口 ÷ 200) × 太守政治加成
 * **Validates: Requirements 5.2**
 * @param agriculture - 城市农业值
 * @param population - 城市人口
 * @param governorPol - 太守政治值 (null表示无太守)
 * @returns 年度粮食收入
 */
export function calculateYearlyGrain(
  agriculture: number,
  population: number,
  governorPol: number | null
): number {
  const baseGrain = agriculture * 10 + population / 200;
  const bonus = calculatePoliticsBonus(governorPol);
  return Math.floor(baseGrain * bonus);
}

/**
 * 计算开发指令的数值增长
 * 公式: 执行武将政治 ÷ 5 + 随机波动(1-5)
 * **Validates: Requirements 5.3**
 * @param executorPol - 执行武将的政治值
 * @param randomValue - 随机波动值 (1-5)，用于测试时可注入
 * @returns 数值增长量
 */
export function calculateDevelopmentIncrease(
  executorPol: number,
  randomValue: number = Math.floor(Math.random() * 5) + 1
): number {
  return Math.floor(executorPol / 5) + randomValue;
}

/**
 * 执行开发指令（商业或农业）
 * 消耗100金，增加目标值
 * **Validates: Requirements 5.3**
 * @param currentGold - 当前金钱
 * @param currentValue - 当前商业/农业值
 * @param executorPol - 执行武将的政治值
 * @param maxValue - 最大值限制
 * @param randomValue - 随机波动值 (1-5)，用于测试时可注入
 * @returns 开发结果
 */
export function executeDevelopment(
  currentGold: number,
  currentValue: number,
  executorPol: number,
  maxValue: number = COMMERCE_MAX,
  randomValue?: number
): DomesticResult {
  // 检查金钱是否足够
  if (currentGold < DEVELOPMENT_GOLD_COST) {
    return {
      success: false,
      goldSpent: 0,
      valueIncrease: 0,
      newValue: currentValue,
      error: '金钱不足',
    };
  }

  // 计算增长值
  const increase = calculateDevelopmentIncrease(executorPol, randomValue);
  
  // 计算新值，不超过最大值
  const newValue = Math.min(currentValue + increase, maxValue);
  const actualIncrease = newValue - currentValue;

  return {
    success: true,
    goldSpent: DEVELOPMENT_GOLD_COST,
    valueIncrease: actualIncrease,
    newValue,
  };
}

/**
 * 计算征兵获得的士兵数
 * 公式: 统帅 × 10 + 魅力 × 5
 * **Validates: Requirements 5.4**
 * @param lead - 武将统帅值
 * @param cha - 武将魅力值
 * @returns 获得的士兵数
 */
export function calculateRecruitmentSoldiers(lead: number, cha: number): number {
  return lead * 10 + cha * 5;
}

/**
 * 计算征兵对民忠的负面影响
 * 基于武将魅力值，魅力越高影响越小
 * **Validates: Requirements 5.5**
 * @param cha - 武将魅力值
 * @returns 民忠降低值
 */
export function calculateLoyaltyDecrease(cha: number): number {
  // 基础降低5点，魅力每20点减少1点降低
  const reduction = Math.floor(cha / 20);
  return Math.max(1, RECRUITMENT_BASE_LOYALTY_DECREASE - reduction);
}

/**
 * 执行征兵指令
 * 消耗金钱和人口，获得士兵，降低民忠
 * **Validates: Requirements 5.4, 5.5**
 * @param cityResources - 城市资源
 * @param executorLead - 执行武将的统帅值
 * @param executorCha - 执行武将的魅力值
 * @returns 征兵结果
 */
export function executeRecruitment(
  cityResources: CityResources,
  executorLead: number,
  executorCha: number
): RecruitResult {
  // 计算可获得的士兵数
  const soldiersGained = calculateRecruitmentSoldiers(executorLead, executorCha);
  
  // 计算所需资源
  const goldNeeded = soldiersGained * RECRUITMENT_GOLD_PER_SOLDIER;
  const populationNeeded = soldiersGained * RECRUITMENT_POPULATION_PER_SOLDIER;
  
  // 检查金钱是否足够
  if (cityResources.gold < goldNeeded) {
    return {
      success: false,
      goldSpent: 0,
      populationSpent: 0,
      soldiersGained: 0,
      loyaltyDecrease: 0,
      error: '金钱不足',
    };
  }
  
  // 检查人口是否足够
  if (cityResources.population < populationNeeded) {
    return {
      success: false,
      goldSpent: 0,
      populationSpent: 0,
      soldiersGained: 0,
      loyaltyDecrease: 0,
      error: '人口不足',
    };
  }
  
  // 计算民忠降低
  const loyaltyDecrease = calculateLoyaltyDecrease(executorCha);

  return {
    success: true,
    goldSpent: goldNeeded,
    populationSpent: populationNeeded,
    soldiersGained,
    loyaltyDecrease,
  };
}
