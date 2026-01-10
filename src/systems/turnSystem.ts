/**
 * 回合系统 - 处理游戏回合流程和时间推进
 * @module systems/turnSystem
 */

import type { GameState } from '../types/gameState';
import type { General } from '../types/general';
import type { GameTimestamp } from '../types/events';
import {
  INITIAL_ACTION_POINTS,
  AP_COST_DOMESTIC,
  AP_COST_MOVEMENT,
  AP_COST_CAMPAIGN,
} from '../types/gameState';
import { calculateMonthlyIncome, calculateYearlyGrain } from './domestic';

/**
 * 行动类型
 */
export type ActionType = 'domestic' | 'movement' | 'campaign';

/**
 * 行动力消耗结果
 */
export interface APDeductionResult {
  /** 是否成功扣除 */
  success: boolean;
  /** 扣除后的行动力 */
  remainingAP: number;
  /** 扣除的行动力 */
  deducted: number;
  /** 错误信息 */
  error?: string;
}

/**
 * 月份推进结果
 */
export interface MonthAdvanceResult {
  /** 新的日期 */
  newDate: GameTimestamp;
  /** 是否跨年 */
  yearChanged: boolean;
  /** 是否为一月（需要年龄递增） */
  isJanuary: boolean;
  /** 是否为七月（需要粮食发放） */
  isJuly: boolean;
}

/**
 * 年度事件结果
 */
export interface YearlyEventResult {
  /** 武将年龄变化 */
  ageIncrements?: Record<string, number>;
  /** 粮食收入 */
  grainIncome?: Record<string, number>;
}

/**
 * 获取行动力消耗值
 * **Validates: Requirements 9.3, 9.4, 9.5**
 */
export function getActionPointCost(actionType: ActionType): number {
  switch (actionType) {
    case 'domestic':
      return AP_COST_DOMESTIC; // 1 AP
    case 'movement':
      return AP_COST_MOVEMENT; // 1 AP
    case 'campaign':
      return AP_COST_CAMPAIGN; // 2 AP
  }
}


/**
 * 检查是否有足够的行动力
 * **Validates: Requirements 9.3, 9.4, 9.5**
 */
export function hasEnoughAP(currentAP: number, actionType: ActionType): boolean {
  return currentAP >= getActionPointCost(actionType);
}

/**
 * 扣除行动力
 * 行动力不能为负
 * **Validates: Requirements 9.3, 9.4, 9.5**
 */
export function deductActionPoints(
  currentAP: number,
  actionType: ActionType
): APDeductionResult {
  const cost = getActionPointCost(actionType);

  if (currentAP < cost) {
    return {
      success: false,
      remainingAP: currentAP,
      deducted: 0,
      error: `行动力不足，需要 ${cost} 点，当前 ${currentAP} 点`,
    };
  }

  return {
    success: true,
    remainingAP: currentAP - cost,
    deducted: cost,
  };
}

/**
 * 恢复行动力到初始值
 * **Validates: Requirements 9.2**
 */
export function restoreActionPoints(): number {
  return INITIAL_ACTION_POINTS;
}

/**
 * 计算下一个月份
 * 12月后进入下一年1月
 * **Validates: Requirements 9.10**
 */
export function advanceMonth(current: GameTimestamp): MonthAdvanceResult {
  let newYear = current.year;
  let newMonth = current.month + 1;
  let yearChanged = false;

  if (newMonth > 12) {
    newMonth = 1;
    newYear = current.year + 1;
    yearChanged = true;
  }

  return {
    newDate: { year: newYear, month: newMonth },
    yearChanged,
    isJanuary: newMonth === 1,
    isJuly: newMonth === 7,
  };
}

/**
 * 递增所有存活武将的年龄
 * 仅在一月执行
 * **Validates: Requirements 9.11**
 */
export function incrementGeneralAges(
  generals: Record<string, General>
): Record<string, General> {
  const updatedGenerals: Record<string, General> = {};

  for (const [id, general] of Object.entries(generals)) {
    if (general.isAlive) {
      updatedGenerals[id] = {
        ...general,
        age: general.age + 1,
      };
    } else {
      updatedGenerals[id] = general;
    }
  }

  return updatedGenerals;
}

/**
 * 获取武将年龄递增记录
 * 用于生成事件日志
 * **Validates: Requirements 9.11**
 */
export function getAgeIncrementRecord(
  generals: Record<string, General>
): Record<string, number> {
  const record: Record<string, number> = {};

  for (const [id, general] of Object.entries(generals)) {
    if (general.isAlive) {
      record[id] = general.age + 1;
    }
  }

  return record;
}


/**
 * 计算并发放七月粮食收入
 * **Validates: Requirements 9.12**
 */
export function distributeJulyGrain(
  gameState: GameState
): Record<string, number> {
  const grainIncome: Record<string, number> = {};

  for (const [cityId, city] of Object.entries(gameState.cities)) {
    // 获取太守政治值
    let governorPol: number | null = null;
    if (city.governor && gameState.generals[city.governor]) {
      governorPol = gameState.generals[city.governor].attributes.pol;
    }

    // 计算粮食收入
    const grain = calculateYearlyGrain(
      city.resources.agriculture,
      city.resources.population,
      governorPol
    );

    grainIncome[cityId] = grain;
  }

  return grainIncome;
}

/**
 * 计算月度金钱收入
 * **Validates: Requirements 5.1**
 */
export function calculateMonthlyGoldIncome(
  gameState: GameState
): Record<string, number> {
  const goldIncome: Record<string, number> = {};

  for (const [cityId, city] of Object.entries(gameState.cities)) {
    // 获取太守政治值
    let governorPol: number | null = null;
    if (city.governor && gameState.generals[city.governor]) {
      governorPol = gameState.generals[city.governor].attributes.pol;
    }

    // 计算金钱收入
    const gold = calculateMonthlyIncome(
      city.resources.commerce,
      city.resources.population,
      governorPol
    );

    goldIncome[cityId] = gold;
  }

  return goldIncome;
}

/**
 * 检查是否应该结束玩家回合
 * 当行动力为0或玩家主动结束时
 * **Validates: Requirements 9.6**
 */
export function shouldEndPlayerTurn(actionPoints: number, forceEnd: boolean): boolean {
  return actionPoints <= 0 || forceEnd;
}

/**
 * 执行回合结束流程
 * **Validates: Requirements 9.6, 9.10, 9.11, 9.12**
 */
export function processTurnEnd(
  gameState: GameState
): {
  newDate: GameTimestamp;
  updatedGenerals?: Record<string, General>;
  grainIncome?: Record<string, number>;
  goldIncome: Record<string, number>;
} {
  // 推进月份
  const monthResult = advanceMonth(gameState.currentDate);

  // 计算月度金钱收入
  const goldIncome = calculateMonthlyGoldIncome(gameState);

  const result: {
    newDate: GameTimestamp;
    updatedGenerals?: Record<string, General>;
    grainIncome?: Record<string, number>;
    goldIncome: Record<string, number>;
  } = {
    newDate: monthResult.newDate,
    goldIncome,
  };

  // 一月：武将年龄递增
  if (monthResult.isJanuary) {
    result.updatedGenerals = incrementGeneralAges(gameState.generals);
  }

  // 七月：粮食发放
  if (monthResult.isJuly) {
    result.grainIncome = distributeJulyGrain(gameState);
  }

  return result;
}

/**
 * 验证行动力消耗序列的一致性
 * 用于属性测试
 * **Validates: Requirements 9.3, 9.4, 9.5**
 */
export function validateAPConsumption(
  initialAP: number,
  actions: ActionType[]
): { finalAP: number; allValid: boolean } {
  let currentAP = initialAP;
  let allValid = true;

  for (const action of actions) {
    const result = deductActionPoints(currentAP, action);
    if (result.success) {
      currentAP = result.remainingAP;
    } else {
      allValid = false;
      break;
    }
  }

  // 确保行动力不为负
  if (currentAP < 0) {
    allValid = false;
  }

  return { finalAP: currentAP, allValid };
}
