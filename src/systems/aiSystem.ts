/**
 * AI决策系统 - 处理AI势力的自动决策和行动
 * @module systems/aiSystem
 * **Validates: Requirements 9.8**
 */

import type { GameState } from '../types/gameState';
import type { City } from '../types/city';
import type { General } from '../types/general';
import type { Faction } from '../types/faction';
import type { GameEvent, DomesticEventData, BattleEventData } from '../types/events';
import { calculateAttackPower, calculateDefensePower } from './battle';
import { calculateRecruitmentSoldiers } from './domestic';

/**
 * AI行动类型
 */
export type AIActionType = 'recruit' | 'develop' | 'attack';

/**
 * AI行动接口
 */
export type AIAction =
  | { type: 'recruit'; cityId: string; generalId: string }
  | { type: 'develop'; cityId: string; generalId: string; target: 'commerce' | 'agriculture' }
  | { type: 'attack'; fromCity: string; toCity: string; generalId: string };

/**
 * 威胁信息接口
 */
export interface ThreatInfo {
  /** 威胁来源势力ID */
  factionId: string;
  /** 威胁来源势力名称 */
  factionName: string;
  /** 威胁来源城市ID */
  cityId: string;
  /** 威胁来源城市名称 */
  cityName: string;
  /** 敌方总兵力 */
  troops: number;
  /** 距离（相邻为1） */
  distance: number;
  /** 威胁评分 */
  threatScore: number;
}

/**
 * 城市评估结果
 */
export interface CityEvaluation {
  cityId: string;
  /** 防御能力评分 */
  defenseScore: number;
  /** 经济价值评分 */
  economicScore: number;
  /** 战略价值评分 */
  strategicScore: number;
  /** 总评分 */
  totalScore: number;
}

/**
 * 攻击目标评估
 */
export interface AttackTargetEvaluation {
  targetCityId: string;
  targetCityName: string;
  /** 攻击成功概率估算 */
  successProbability: number;
  /** 战略价值 */
  strategicValue: number;
  /** 综合评分 */
  score: number;
}

/**
 * AI决策权重常量
 */
export const AI_WEIGHTS = {
  /** 威胁评估中兵力的权重 */
  THREAT_TROOPS_WEIGHT: 1.0,
  /** 威胁评估中距离的权重（距离越近威胁越大） */
  THREAT_DISTANCE_WEIGHT: 2.0,
  /** 经济发展优先级阈值（低于此兵力时优先发展） */
  ECONOMIC_PRIORITY_TROOPS_THRESHOLD: 5000,
  /** 征兵优先级阈值（低于此兵力时优先征兵） */
  RECRUIT_PRIORITY_TROOPS_THRESHOLD: 10000,
  /** 攻击决策的最小胜率阈值 */
  MIN_ATTACK_SUCCESS_PROBABILITY: 0.6,
  /** 城市规模评分 */
  CITY_SCALE_SCORE: {
    small: 1,
    medium: 2,
    large: 3,
  },
} as const;


/**
 * 计算城市的总兵力
 * @param city - 城市
 * @param generals - 所有武将
 * @returns 城市总兵力
 */
export function calculateCityTroops(
  city: City,
  generals: Record<string, General>
): number {
  return city.stationedGenerals.reduce((total, generalId) => {
    const general = generals[generalId];
    if (general && general.isAlive) {
      return total + general.troops;
    }
    return total;
  }, 0);
}

/**
 * 获取城市中最强的武将（按战斗力）
 * @param city - 城市
 * @param generals - 所有武将
 * @returns 最强武将或null
 */
export function getStrongestGeneral(
  city: City,
  generals: Record<string, General>
): General | null {
  let strongest: General | null = null;
  let maxPower = -1;

  for (const generalId of city.stationedGenerals) {
    const general = generals[generalId];
    if (general && general.isAlive && general.troops > 0) {
      // 综合考虑武力和统帅
      const power = general.attributes.war * 0.4 + general.attributes.lead * 0.6;
      if (power > maxPower) {
        maxPower = power;
        strongest = general;
      }
    }
  }

  return strongest;
}

/**
 * 获取城市中政治最高的武将（用于内政）
 * @param city - 城市
 * @param generals - 所有武将
 * @returns 政治最高的武将或null
 */
export function getBestPoliticsGeneral(
  city: City,
  generals: Record<string, General>
): General | null {
  let best: General | null = null;
  let maxPol = -1;

  for (const generalId of city.stationedGenerals) {
    const general = generals[generalId];
    if (general && general.isAlive) {
      if (general.attributes.pol > maxPol) {
        maxPol = general.attributes.pol;
        best = general;
      }
    }
  }

  return best;
}

/**
 * 评估来自相邻城市的威胁
 * **Validates: Requirements 9.8**
 * @param cityId - 被评估城市ID
 * @param gameState - 游戏状态
 * @returns 威胁信息列表
 */
export function evaluateThreat(
  cityId: string,
  gameState: GameState
): ThreatInfo[] {
  const city = gameState.cities[cityId];
  if (!city) return [];

  const threats: ThreatInfo[] = [];
  const myFaction = city.faction;

  // 检查所有相邻城市
  for (const connectedCityId of city.connectedCities) {
    const connectedCity = gameState.cities[connectedCityId];
    if (!connectedCity) continue;

    // 只考虑敌对势力
    const connectedFaction = gameState.factions[connectedCity.faction];
    const myFactionData = gameState.factions[myFaction];
    
    if (!connectedFaction || !myFactionData) continue;
    
    // 检查外交关系
    const diplomacy = myFactionData.diplomacy[connectedCity.faction];
    if (diplomacy !== 'hostile' && connectedCity.faction !== myFaction) {
      // 非敌对且非己方，跳过
      continue;
    }
    
    if (connectedCity.faction === myFaction) continue;

    // 计算敌方兵力
    const enemyTroops = calculateCityTroops(connectedCity, gameState.generals);
    
    if (enemyTroops <= 0) continue;

    // 计算威胁评分
    const threatScore = 
      enemyTroops * AI_WEIGHTS.THREAT_TROOPS_WEIGHT / 1000 +
      AI_WEIGHTS.THREAT_DISTANCE_WEIGHT; // 相邻城市距离为1

    threats.push({
      factionId: connectedCity.faction,
      factionName: connectedFaction.name,
      cityId: connectedCityId,
      cityName: connectedCity.name,
      troops: enemyTroops,
      distance: 1,
      threatScore,
    });
  }

  // 按威胁评分降序排序
  return threats.sort((a, b) => b.threatScore - a.threatScore);
}


/**
 * 评估攻击目标
 * @param fromCity - 出发城市
 * @param targetCity - 目标城市
 * @param gameState - 游戏状态
 * @returns 攻击目标评估结果
 */
export function evaluateAttackTarget(
  fromCity: City,
  targetCity: City,
  gameState: GameState
): AttackTargetEvaluation {
  // 计算我方攻击力
  const myTroops = calculateCityTroops(fromCity, gameState.generals);
  const myGeneral = getStrongestGeneral(fromCity, gameState.generals);
  
  let myAttackPower = 0;
  if (myGeneral) {
    myAttackPower = calculateAttackPower(
      myTroops,
      myGeneral.attributes.war,
      myGeneral.attributes.lead
    );
  }

  // 计算敌方防御力
  const enemyTroops = calculateCityTroops(targetCity, gameState.generals);
  const enemyGeneral = getStrongestGeneral(targetCity, gameState.generals);
  
  let enemyDefensePower = targetCity.resources.defense;
  if (enemyGeneral) {
    enemyDefensePower = calculateDefensePower(
      enemyTroops,
      enemyGeneral.attributes.lead,
      enemyGeneral.attributes.int,
      targetCity.resources.defense
    );
  }

  // 估算成功概率（简化计算）
  const powerRatio = enemyDefensePower > 0 ? myAttackPower / enemyDefensePower : 10;
  const successProbability = Math.min(0.95, Math.max(0.05, powerRatio / 2));

  // 计算战略价值
  const strategicValue = 
    AI_WEIGHTS.CITY_SCALE_SCORE[targetCity.scale] * 10 +
    targetCity.resources.commerce / 100 +
    targetCity.resources.agriculture / 100;

  // 综合评分
  const score = successProbability * strategicValue;

  return {
    targetCityId: targetCity.id,
    targetCityName: targetCity.name,
    successProbability,
    strategicValue,
    score,
  };
}

/**
 * 判断是否应该发起攻击
 * **Validates: Requirements 9.8**
 * @param factionId - 势力ID
 * @param targetCityId - 目标城市ID
 * @param gameState - 游戏状态
 * @returns 是否应该攻击
 */
export function shouldAttack(
  factionId: string,
  targetCityId: string,
  gameState: GameState
): boolean {
  const faction = gameState.factions[factionId];
  if (!faction) return false;

  const targetCity = gameState.cities[targetCityId];
  if (!targetCity) return false;

  // 检查是否为敌对势力
  const diplomacy = faction.diplomacy[targetCity.faction];
  if (diplomacy !== 'hostile') return false;

  // 找到可以发起攻击的己方城市
  for (const cityId of faction.cities) {
    const city = gameState.cities[cityId];
    if (!city) continue;

    // 检查是否相邻
    if (!city.connectedCities.includes(targetCityId)) continue;

    // 评估攻击
    const evaluation = evaluateAttackTarget(city, targetCity, gameState);
    
    if (evaluation.successProbability >= AI_WEIGHTS.MIN_ATTACK_SUCCESS_PROBABILITY) {
      return true;
    }
  }

  return false;
}

/**
 * 判断是否应该征兵
 * **Validates: Requirements 9.8**
 * @param cityId - 城市ID
 * @param gameState - 游戏状态
 * @returns 是否应该征兵
 */
export function shouldRecruit(
  cityId: string,
  gameState: GameState
): boolean {
  const city = gameState.cities[cityId];
  if (!city) return false;

  // 计算当前兵力
  const currentTroops = calculateCityTroops(city, gameState.generals);

  // 评估威胁
  const threats = evaluateThreat(cityId, gameState);
  const totalThreat = threats.reduce((sum, t) => sum + t.troops, 0);

  // 如果兵力低于阈值或面临较大威胁，应该征兵
  if (currentTroops < AI_WEIGHTS.RECRUIT_PRIORITY_TROOPS_THRESHOLD) {
    return true;
  }

  // 如果敌方兵力超过我方，应该征兵
  if (totalThreat > currentTroops * 1.5) {
    return true;
  }

  return false;
}


/**
 * 为AI势力生成决策
 * **Validates: Requirements 9.8**
 * @param factionId - 势力ID
 * @param gameState - 游戏状态
 * @returns AI行动列表
 */
export function makeDecision(
  factionId: string,
  gameState: GameState
): AIAction[] {
  const faction = gameState.factions[factionId];
  if (!faction) return [];

  const actions: AIAction[] = [];
  let remainingAP = 3; // AI每回合也有3点行动力

  // 遍历所有己方城市
  for (const cityId of faction.cities) {
    if (remainingAP <= 0) break;

    const city = gameState.cities[cityId];
    if (!city) continue;

    // 1. 优先级：检查是否需要征兵
    if (shouldRecruit(cityId, gameState) && remainingAP >= 1) {
      const general = getBestPoliticsGeneral(city, gameState.generals);
      if (general && city.resources.gold >= 1000 && city.resources.population >= 500) {
        actions.push({
          type: 'recruit',
          cityId,
          generalId: general.id,
        });
        remainingAP -= 1;
        continue;
      }
    }

    // 2. 检查是否可以发起攻击
    if (remainingAP >= 2) {
      const attackTarget = findBestAttackTarget(city, faction, gameState);
      if (attackTarget) {
        const attacker = getStrongestGeneral(city, gameState.generals);
        if (attacker && attacker.troops >= 1000) {
          actions.push({
            type: 'attack',
            fromCity: cityId,
            toCity: attackTarget.targetCityId,
            generalId: attacker.id,
          });
          remainingAP -= 2;
          continue;
        }
      }
    }

    // 3. 发展内政
    if (remainingAP >= 1 && city.resources.gold >= 100) {
      const general = getBestPoliticsGeneral(city, gameState.generals);
      if (general) {
        // 决定发展商业还是农业
        const target = city.resources.commerce < city.resources.agriculture 
          ? 'commerce' 
          : 'agriculture';
        
        actions.push({
          type: 'develop',
          cityId,
          generalId: general.id,
          target,
        });
        remainingAP -= 1;
      }
    }
  }

  return actions;
}

/**
 * 找到最佳攻击目标
 * @param fromCity - 出发城市
 * @param faction - 势力
 * @param gameState - 游戏状态
 * @returns 最佳攻击目标评估或null
 */
export function findBestAttackTarget(
  fromCity: City,
  faction: Faction,
  gameState: GameState
): AttackTargetEvaluation | null {
  let bestTarget: AttackTargetEvaluation | null = null;

  for (const connectedCityId of fromCity.connectedCities) {
    const targetCity = gameState.cities[connectedCityId];
    if (!targetCity) continue;

    // 只攻击敌对势力
    const diplomacy = faction.diplomacy[targetCity.faction];
    if (diplomacy !== 'hostile') continue;

    const evaluation = evaluateAttackTarget(fromCity, targetCity, gameState);
    
    // 只考虑胜率足够高的目标
    if (evaluation.successProbability < AI_WEIGHTS.MIN_ATTACK_SUCCESS_PROBABILITY) {
      continue;
    }

    if (!bestTarget || evaluation.score > bestTarget.score) {
      bestTarget = evaluation;
    }
  }

  return bestTarget;
}


/**
 * 生成唯一事件ID
 */
function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 执行AI征兵行动并生成事件
 * @param action - 征兵行动
 * @param gameState - 游戏状态
 * @returns 生成的事件或null
 */
export function executeAIRecruit(
  action: Extract<AIAction, { type: 'recruit' }>,
  gameState: GameState
): { event: GameEvent; soldiersGained: number } | null {
  const city = gameState.cities[action.cityId];
  const general = gameState.generals[action.generalId];
  
  if (!city || !general) return null;

  // 计算征兵数量
  const soldiersGained = calculateRecruitmentSoldiers(
    general.attributes.lead,
    general.attributes.cha
  );

  // 检查资源是否足够
  const goldNeeded = soldiersGained * 2;
  const populationNeeded = soldiersGained;
  
  if (city.resources.gold < goldNeeded || city.resources.population < populationNeeded) {
    return null;
  }

  // 生成内政事件
  const event: GameEvent = {
    id: generateEventId(),
    type: 'domestic',
    timestamp: { ...gameState.currentDate },
    data: {
      city: action.cityId,
      action: 'recruit',
      executor: action.generalId,
      value: soldiersGained,
    } as DomesticEventData,
  };

  return { event, soldiersGained };
}

/**
 * 执行AI开发行动并生成事件
 * @param action - 开发行动
 * @param gameState - 游戏状态
 * @returns 生成的事件或null
 */
export function executeAIDevelop(
  action: Extract<AIAction, { type: 'develop' }>,
  gameState: GameState
): { event: GameEvent; valueIncrease: number } | null {
  const city = gameState.cities[action.cityId];
  const general = gameState.generals[action.generalId];
  
  if (!city || !general) return null;

  // 检查金钱是否足够
  if (city.resources.gold < 100) return null;

  // 计算增长值
  const randomValue = Math.floor(Math.random() * 5) + 1;
  const valueIncrease = Math.floor(general.attributes.pol / 5) + randomValue;

  // 生成内政事件
  const actionType = action.target === 'commerce' ? 'develop_commerce' : 'develop_agriculture';
  
  const event: GameEvent = {
    id: generateEventId(),
    type: 'domestic',
    timestamp: { ...gameState.currentDate },
    data: {
      city: action.cityId,
      action: actionType,
      executor: action.generalId,
      value: valueIncrease,
    } as DomesticEventData,
  };

  return { event, valueIncrease };
}

/**
 * 执行AI攻击行动并生成事件
 * @param action - 攻击行动
 * @param gameState - 游戏状态
 * @returns 生成的事件或null
 */
export function executeAIAttack(
  action: Extract<AIAction, { type: 'attack' }>,
  gameState: GameState
): { event: GameEvent; result: 'win' | 'lose' | 'draw' } | null {
  const fromCity = gameState.cities[action.fromCity];
  const toCity = gameState.cities[action.toCity];
  const attacker = gameState.generals[action.generalId];
  
  if (!fromCity || !toCity || !attacker) return null;

  // 获取防守方主将
  const defender = getStrongestGeneral(toCity, gameState.generals);
  
  // 计算战斗结果（简化版）
  const attackerTroops = attacker.troops;
  const attackPower = calculateAttackPower(
    attackerTroops,
    attacker.attributes.war,
    attacker.attributes.lead
  );

  let defensePower = toCity.resources.defense;
  let defenderTroops = 0;
  
  if (defender) {
    defenderTroops = calculateCityTroops(toCity, gameState.generals);
    defensePower = calculateDefensePower(
      defenderTroops,
      defender.attributes.lead,
      defender.attributes.int,
      toCity.resources.defense
    );
  }

  // 简化的战斗结果判定
  const powerRatio = defensePower > 0 ? attackPower / defensePower : 10;
  let result: 'win' | 'lose' | 'draw';
  
  if (powerRatio > 1.5) {
    result = 'win';
  } else if (powerRatio < 0.67) {
    result = 'lose';
  } else {
    result = Math.random() > 0.5 ? 'win' : 'lose';
  }

  // 计算伤亡
  const baseCasualties = Math.floor(Math.min(attackerTroops, defenderTroops) * 0.1);
  const attackerCasualties = result === 'win' 
    ? Math.floor(baseCasualties * 0.8) 
    : Math.floor(baseCasualties * 1.2);
  const defenderCasualties = result === 'win' 
    ? Math.floor(baseCasualties * 1.2) 
    : Math.floor(baseCasualties * 0.8);

  // 生成战斗事件
  const event: GameEvent = {
    id: generateEventId(),
    type: 'battle',
    timestamp: { ...gameState.currentDate },
    data: {
      attacker: fromCity.faction,
      defender: toCity.faction,
      attackerGeneral: action.generalId,
      defenderGeneral: defender?.id || '',
      result,
      casualties: {
        attacker: attackerCasualties,
        defender: defenderCasualties,
      },
      cityCapture: result === 'win' ? action.toCity : undefined,
    } as BattleEventData,
  };

  return { event, result };
}


/**
 * 执行所有AI势力的回合
 * **Validates: Requirements 9.8**
 * @param gameState - 游戏状态
 * @param playerFactionId - 玩家势力ID（跳过）
 * @returns 所有AI行动产生的事件和状态更新
 */
export function executeAITurns(
  gameState: GameState,
  playerFactionId: string
): {
  events: GameEvent[];
  stateUpdates: AIStateUpdate[];
} {
  const events: GameEvent[] = [];
  const stateUpdates: AIStateUpdate[] = [];

  // 遍历所有AI势力
  for (const [factionId, faction] of Object.entries(gameState.factions)) {
    // 跳过玩家势力
    if (factionId === playerFactionId) continue;

    // 跳过已灭亡的势力（没有城市）
    if (faction.cities.length === 0) continue;

    // 生成AI决策
    const actions = makeDecision(factionId, gameState);

    // 执行每个行动
    for (const action of actions) {
      switch (action.type) {
        case 'recruit': {
          const result = executeAIRecruit(action, gameState);
          if (result) {
            events.push(result.event);
            stateUpdates.push({
              type: 'recruit',
              factionId,
              cityId: action.cityId,
              generalId: action.generalId,
              value: result.soldiersGained,
            });
          }
          break;
        }
        case 'develop': {
          const result = executeAIDevelop(action, gameState);
          if (result) {
            events.push(result.event);
            stateUpdates.push({
              type: 'develop',
              factionId,
              cityId: action.cityId,
              generalId: action.generalId,
              target: action.target,
              value: result.valueIncrease,
            });
          }
          break;
        }
        case 'attack': {
          const result = executeAIAttack(action, gameState);
          if (result) {
            events.push(result.event);
            stateUpdates.push({
              type: 'attack',
              factionId,
              fromCityId: action.fromCity,
              toCityId: action.toCity,
              generalId: action.generalId,
              result: result.result,
            });
          }
          break;
        }
      }
    }
  }

  return { events, stateUpdates };
}

/**
 * AI状态更新接口
 */
export type AIStateUpdate =
  | {
      type: 'recruit';
      factionId: string;
      cityId: string;
      generalId: string;
      value: number;
    }
  | {
      type: 'develop';
      factionId: string;
      cityId: string;
      generalId: string;
      target: 'commerce' | 'agriculture';
      value: number;
    }
  | {
      type: 'attack';
      factionId: string;
      fromCityId: string;
      toCityId: string;
      generalId: string;
      result: 'win' | 'lose' | 'draw';
    };

/**
 * 应用AI状态更新到游戏状态
 * @param gameState - 当前游戏状态
 * @param updates - AI状态更新列表
 * @returns 更新后的游戏状态
 */
export function applyAIStateUpdates(
  gameState: GameState,
  updates: AIStateUpdate[]
): GameState {
  // 深拷贝状态
  const newState: GameState = JSON.parse(JSON.stringify(gameState));

  for (const update of updates) {
    switch (update.type) {
      case 'recruit': {
        const city = newState.cities[update.cityId];
        const general = newState.generals[update.generalId];
        if (city && general) {
          // 扣除资源
          const goldCost = update.value * 2;
          const populationCost = update.value;
          city.resources.gold -= goldCost;
          city.resources.population -= populationCost;
          city.resources.loyalty = Math.max(0, city.resources.loyalty - 3);
          // 增加兵力
          general.troops += update.value;
        }
        break;
      }
      case 'develop': {
        const city = newState.cities[update.cityId];
        if (city) {
          // 扣除金钱
          city.resources.gold -= 100;
          // 增加对应值
          if (update.target === 'commerce') {
            city.resources.commerce = Math.min(999, city.resources.commerce + update.value);
          } else {
            city.resources.agriculture = Math.min(999, city.resources.agriculture + update.value);
          }
        }
        break;
      }
      case 'attack': {
        if (update.result === 'win') {
          const fromCity = newState.cities[update.fromCityId];
          const toCity = newState.cities[update.toCityId];
          const attacker = newState.generals[update.generalId];
          
          if (fromCity && toCity && attacker) {
            const oldFaction = newState.factions[toCity.faction];
            const newFaction = newState.factions[update.factionId];
            
            if (oldFaction && newFaction) {
              // 更新城市归属
              oldFaction.cities = oldFaction.cities.filter(c => c !== update.toCityId);
              newFaction.cities.push(update.toCityId);
              toCity.faction = update.factionId;
              
              // 移动攻击武将到新城市
              fromCity.stationedGenerals = fromCity.stationedGenerals.filter(
                g => g !== update.generalId
              );
              toCity.stationedGenerals.push(update.generalId);
              attacker.currentCity = update.toCityId;
              
              // 俘获或驱逐敌方武将
              for (const generalId of [...toCity.stationedGenerals]) {
                const general = newState.generals[generalId];
                if (general && general.faction !== update.factionId) {
                  // 简化处理：敌方武将逃跑到其他城市
                  const escapeCities = oldFaction.cities.filter(c => c !== update.toCityId);
                  if (escapeCities.length > 0) {
                    const escapeCity = escapeCities[0];
                    toCity.stationedGenerals = toCity.stationedGenerals.filter(
                      g => g !== generalId
                    );
                    newState.cities[escapeCity].stationedGenerals.push(generalId);
                    general.currentCity = escapeCity;
                  }
                }
              }
            }
          }
        }
        break;
      }
    }
  }

  return newState;
}

