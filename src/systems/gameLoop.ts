/**
 * 游戏循环控制器
 * 整合玩家回合、计算阶段、叙事阶段
 * @module systems/gameLoop
 * 
 * Requirements: 9.6, 9.7, 9.9
 */

import type { GameState, GamePhase } from '../types/gameState';
import type { GameEvent } from '../types/events';
import { processTurnEnd, restoreActionPoints } from './turnSystem';
import { executeAITurns, applyAIStateUpdates } from './aiSystem';
import {
  createHistorianService,
  createEventContextFromState,
} from '../services/llm/historianService';
import { storageService } from '../services/storageService';

/**
 * 游戏循环状态
 */
export interface GameLoopState {
  /** 当前阶段 */
  phase: GamePhase;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 加载消息 */
  loadingMessage: string;
  /** 待处理事件 */
  pendingEvents: GameEvent[];
}

/**
 * 游戏循环回调接口
 */
export interface GameLoopCallbacks {
  /** 阶段变更回调 */
  onPhaseChange: (phase: GamePhase) => void;
  /** 加载状态变更回调 */
  onLoadingChange: (isLoading: boolean, message: string) => void;
  /** 事件添加回调 */
  onEventsAdded: (events: GameEvent[]) => void;
  /** 状态更新回调 */
  onStateUpdate: (state: GameState) => void;
  /** 月份推进回调 */
  onMonthAdvanced: (newDate: { year: number; month: number }) => void;
}

/**
 * 游戏循环控制器类
 */
export class GameLoopController {
  private callbacks: GameLoopCallbacks;
  private isProcessing: boolean = false;

  constructor(callbacks: GameLoopCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * 结束玩家回合
   * 触发计算阶段和叙事阶段
   * **Validates: Requirements 9.6**
   */
  async endPlayerTurn(gameState: GameState): Promise<GameState> {
    if (this.isProcessing) {
      console.warn('游戏循环正在处理中，请稍候');
      return gameState;
    }

    this.isProcessing = true;
    let currentState = { ...gameState };

    try {
      // 1. 进入计算阶段
      // **Validates: Requirements 9.7**
      this.callbacks.onPhaseChange('calculation');
      this.callbacks.onLoadingChange(true, '正在计算AI行动...');

      // 2. 执行AI回合
      const aiResult = executeAITurns(currentState, currentState.currentFaction);
      
      // 应用AI状态更新
      if (aiResult.stateUpdates.length > 0) {
        currentState = applyAIStateUpdates(currentState, aiResult.stateUpdates);
      }

      // 3. 处理回合结束（月份推进、收入计算等）
      this.callbacks.onLoadingChange(true, '正在结算回合...');
      const turnResult = processTurnEnd(currentState);

      // 更新日期
      currentState = {
        ...currentState,
        currentDate: turnResult.newDate,
      };

      // 应用金钱收入
      for (const [cityId, gold] of Object.entries(turnResult.goldIncome)) {
        if (currentState.cities[cityId]) {
          currentState.cities[cityId] = {
            ...currentState.cities[cityId],
            resources: {
              ...currentState.cities[cityId].resources,
              gold: currentState.cities[cityId].resources.gold + gold,
            },
          };
        }
      }

      // 一月：武将年龄递增
      if (turnResult.updatedGenerals) {
        currentState = {
          ...currentState,
          generals: turnResult.updatedGenerals,
        };
      }

      // 七月：粮食发放
      if (turnResult.grainIncome) {
        for (const [cityId, grain] of Object.entries(turnResult.grainIncome)) {
          if (currentState.cities[cityId]) {
            currentState.cities[cityId] = {
              ...currentState.cities[cityId],
              resources: {
                ...currentState.cities[cityId].resources,
                grain: currentState.cities[cityId].resources.grain + grain,
              },
            };
          }
        }
      }

      // 4. 进入叙事阶段
      // **Validates: Requirements 9.9**
      this.callbacks.onPhaseChange('narrative');
      this.callbacks.onLoadingChange(true, '史官正在记录...');

      // 处理AI事件叙事
      if (aiResult.events.length > 0) {
        const processedEvents = await this.processNarrativePhase(
          aiResult.events,
          currentState
        );
        
        // 添加事件到日志
        currentState = {
          ...currentState,
          eventLog: [...processedEvents, ...currentState.eventLog],
        };
        
        this.callbacks.onEventsAdded(processedEvents);
      }

      // 5. 自动保存
      storageService.autoSave(currentState);

      // 6. 恢复行动力，进入新回合
      currentState = {
        ...currentState,
        actionPoints: restoreActionPoints(),
        phase: 'player',
      };

      this.callbacks.onPhaseChange('player');
      this.callbacks.onMonthAdvanced(currentState.currentDate);
      this.callbacks.onStateUpdate(currentState);

    } catch (error) {
      console.error('游戏循环处理错误:', error);
    } finally {
      this.isProcessing = false;
      this.callbacks.onLoadingChange(false, '');
    }

    return currentState;
  }

  /**
   * 处理叙事阶段
   * 将事件发送给LLM生成叙事文本
   * **Validates: Requirements 9.9**
   */
  private async processNarrativePhase(
    events: GameEvent[],
    gameState: GameState
  ): Promise<GameEvent[]> {
    if (events.length === 0) {
      return [];
    }

    try {
      // 创建事件上下文
      const context = createEventContextFromState(
        gameState.generals,
        gameState.cities,
        gameState.factions
      );

      // 创建史官服务
      const historian = createHistorianService(context);

      // 生成叙事文本
      const processedEvents = await historian.processEvents(events);

      return processedEvents;
    } catch (error) {
      console.error('叙事生成失败:', error);
      // 返回原始事件（无叙事文本）
      return events;
    }
  }

  /**
   * 检查是否正在处理
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }
}

/**
 * 创建游戏循环控制器
 */
export function createGameLoopController(
  callbacks: GameLoopCallbacks
): GameLoopController {
  return new GameLoopController(callbacks);
}

/**
 * 检查是否应该显示加载指示器
 * **Validates: Requirements 9.7**
 */
export function shouldShowLoading(phase: GamePhase): boolean {
  return phase === 'calculation' || phase === 'narrative';
}

/**
 * 获取阶段显示文本
 */
export function getPhaseDisplayText(phase: GamePhase): string {
  switch (phase) {
    case 'player':
      return '玩家回合';
    case 'calculation':
      return '计算阶段';
    case 'narrative':
      return '叙事阶段';
    default:
      return '';
  }
}
