/**
 * 游戏状态管理器
 * 使用 React Context API 管理全局游戏状态
 * @module store/gameState
 */

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { GameState, GamePhase } from '../types/gameState';
import type { City } from '../types/city';
import type { General } from '../types/general';
import type { Faction } from '../types/faction';
import type { GameEvent, GameTimestamp } from '../types/events';
import {
  INITIAL_ACTION_POINTS,
  AP_COST_DOMESTIC,
  AP_COST_MOVEMENT,
  AP_COST_CAMPAIGN,
  INITIAL_YEAR,
  INITIAL_MONTH,
} from '../types/gameState';

/**
 * 游戏状态动作类型
 */
export type GameAction =
  | { type: 'LOAD_SCENARIO'; payload: Omit<GameState, 'actionPoints' | 'phase' | 'selectedCity' | 'eventLog'> }
  | { type: 'SELECT_CITY'; payload: string | null }
  | { type: 'DEDUCT_AP'; payload: 'domestic' | 'movement' | 'campaign' }
  | { type: 'RESTORE_AP' }
  | { type: 'SET_PHASE'; payload: GamePhase }
  | { type: 'ADVANCE_MONTH' }
  | { type: 'INCREMENT_GENERAL_AGES' }
  | { type: 'UPDATE_CITY'; payload: { cityId: string; updates: Partial<City> } }
  | { type: 'UPDATE_GENERAL'; payload: { generalId: string; updates: Partial<General> } }
  | { type: 'UPDATE_FACTION'; payload: { factionId: string; updates: Partial<Faction> } }
  | { type: 'ADD_EVENT'; payload: GameEvent }
  | { type: 'ADD_EVENTS'; payload: GameEvent[] }
  | { type: 'CLEAR_EVENTS' }
  | { type: 'LOAD_STATE'; payload: GameState }
  | { type: 'APPLY_AI_STATE'; payload: GameState };

/**
 * 初始游戏状态
 */
export const initialGameState: GameState = {
  currentDate: { year: INITIAL_YEAR, month: INITIAL_MONTH },
  currentFaction: '',
  actionPoints: INITIAL_ACTION_POINTS,
  phase: 'player',
  factions: {},
  cities: {},
  generals: {},
  selectedCity: null,
  eventLog: [],
};

/**
 * 获取行动力消耗值
 */
export function getAPCost(actionType: 'domestic' | 'movement' | 'campaign'): number {
  switch (actionType) {
    case 'domestic':
      return AP_COST_DOMESTIC;
    case 'movement':
      return AP_COST_MOVEMENT;
    case 'campaign':
      return AP_COST_CAMPAIGN;
  }
}


/**
 * 计算下一个月份
 */
export function calculateNextMonth(current: GameTimestamp): GameTimestamp {
  if (current.month === 12) {
    return { year: current.year + 1, month: 1 };
  }
  return { year: current.year, month: current.month + 1 };
}

/**
 * 游戏状态 Reducer
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOAD_SCENARIO':
      return {
        ...action.payload,
        actionPoints: INITIAL_ACTION_POINTS,
        phase: 'player',
        selectedCity: null,
        eventLog: [],
      };

    case 'SELECT_CITY':
      return {
        ...state,
        selectedCity: action.payload,
      };

    case 'DEDUCT_AP': {
      const cost = getAPCost(action.payload);
      const newAP = Math.max(0, state.actionPoints - cost);
      return {
        ...state,
        actionPoints: newAP,
      };
    }

    case 'RESTORE_AP':
      return {
        ...state,
        actionPoints: INITIAL_ACTION_POINTS,
      };

    case 'SET_PHASE':
      return {
        ...state,
        phase: action.payload,
      };

    case 'ADVANCE_MONTH':
      return {
        ...state,
        currentDate: calculateNextMonth(state.currentDate),
      };

    case 'INCREMENT_GENERAL_AGES': {
      const updatedGenerals = { ...state.generals };
      for (const generalId in updatedGenerals) {
        const general = updatedGenerals[generalId];
        if (general.isAlive) {
          updatedGenerals[generalId] = {
            ...general,
            age: general.age + 1,
          };
        }
      }
      return {
        ...state,
        generals: updatedGenerals,
      };
    }

    case 'UPDATE_CITY': {
      const { cityId, updates } = action.payload;
      if (!state.cities[cityId]) return state;
      return {
        ...state,
        cities: {
          ...state.cities,
          [cityId]: {
            ...state.cities[cityId],
            ...updates,
          },
        },
      };
    }

    case 'UPDATE_GENERAL': {
      const { generalId, updates } = action.payload;
      if (!state.generals[generalId]) return state;
      return {
        ...state,
        generals: {
          ...state.generals,
          [generalId]: {
            ...state.generals[generalId],
            ...updates,
          },
        },
      };
    }

    case 'UPDATE_FACTION': {
      const { factionId, updates } = action.payload;
      if (!state.factions[factionId]) return state;
      return {
        ...state,
        factions: {
          ...state.factions,
          [factionId]: {
            ...state.factions[factionId],
            ...updates,
          },
        },
      };
    }

    case 'ADD_EVENT':
      return {
        ...state,
        eventLog: [action.payload, ...state.eventLog],
      };

    case 'ADD_EVENTS':
      return {
        ...state,
        eventLog: [...action.payload, ...state.eventLog],
      };

    case 'CLEAR_EVENTS':
      return {
        ...state,
        eventLog: [],
      };

    case 'LOAD_STATE':
      return action.payload;

    case 'APPLY_AI_STATE':
      return {
        ...action.payload,
        // 保留玩家相关状态
        selectedCity: state.selectedCity,
        phase: state.phase,
      };

    default:
      return state;
  }
}


/**
 * 游戏状态 Context 类型
 */
interface GameStateContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

/**
 * 游戏状态 Context
 */
const GameStateContext = createContext<GameStateContextType | null>(null);

/**
 * 游戏状态 Provider Props
 */
interface GameStateProviderProps {
  children: ReactNode;
  initialState?: GameState;
}

/**
 * 游戏状态 Provider 组件
 */
export function GameStateProvider({ children, initialState }: GameStateProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState ?? initialGameState);

  return (
    <GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GameStateContext.Provider>
  );
}

/**
 * 使用游戏状态的 Hook
 * @throws 如果在 GameStateProvider 外部使用
 */
export function useGameState(): GameStateContextType {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}

/**
 * 检查是否有足够的行动力执行指定动作
 */
export function canExecuteAction(
  currentAP: number,
  actionType: 'domestic' | 'movement' | 'campaign'
): boolean {
  return currentAP >= getAPCost(actionType);
}
