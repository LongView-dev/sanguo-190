/**
 * 三国志：群雄割据 190 - 主应用组件
 * 实现三栏式布局和游戏初始化流程
 *
 * Requirements: 1.1, 9.1, 3.5, 11.8
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameStateProvider, useGameState } from './store/gameState';
import type { ActionType } from './components/LeftSidebar';
import { type BattleIndicator } from './components/MapView';
import {
  GameHeader,
  FactionPanel,
  CityPanel,
  ActionsPanel,
  NewsPanel,
  StrategicMap,
} from './components/ui/game';
import { AdvisorDialog } from './components/AdvisorDialog';
import { SaveLoadModal } from './components/SaveLoadModal';
import {
  DomesticActionModal,
  type DomesticActionType,
  type DomesticActionResult,
} from './components/DomesticActionModal';
import { SCENARIO_190, createGameStateFromScenario } from './data/scenario190';
import { storageService } from './services/storageService';
import {
  createGameLoopController,
  shouldShowLoading,
  type GameLoopController,
} from './systems/gameLoop';
import { INITIAL_ACTION_POINTS } from './types/gameState';
import type { GameState, GamePhase } from './types/gameState';
import type { GameEvent, DomesticEventData } from './types/events';
import type { General } from './types/general';
import './App.css';
import './game.css';

/**
 * 默认玩家势力
 */
const DEFAULT_PLAYER_FACTION = 'caocao';

/**
 * 开场叙事文本
 * Requirements: 3.5
 */
const OPENING_NARRATIVE = `公元一九〇年，汉室衰微，天下大乱。

董卓挟天子以令诸侯，占据洛阳、长安两大都城，倒行逆施，天怒人怨。

关东诸侯会盟讨董，袁绍为盟主，曹操、刘备等群雄并起。

然联军各怀心思，貌合神离。董卓西迁长安，焚毁洛阳，天下震动。

乱世已至，英雄当立。君欲何为？`;

/**
 * 游戏主界面组件
 */
function GameMain() {
  const { state, dispatch } = useGameState();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showOpeningNarrative, setShowOpeningNarrative] = useState(false);
  const [showAutoSavePrompt, setShowAutoSavePrompt] = useState(false);
  const [autoSaveInfo, setAutoSaveInfo] = useState<{
    faction: string;
    date: { year: number; month: number };
  } | null>(null);
  const [gameLoopController, setGameLoopController] = useState<GameLoopController | null>(null);
  const [battleIndicators, setBattleIndicators] = useState<BattleIndicator[]>([]);
  const [showAdvisorDialog, setShowAdvisorDialog] = useState(false);
  const [showSaveLoadModal, setShowSaveLoadModal] = useState(false);
  const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load'>('save');
  // 内政对话框状态
  const [showDomesticModal, setShowDomesticModal] = useState(false);
  const [domesticActionType, setDomesticActionType] = useState<DomesticActionType | null>(null);

  /**
   * 初始化游戏循环控制器
   */
  useEffect(() => {
    const controller = createGameLoopController({
      onPhaseChange: (phase: GamePhase) => {
        dispatch({ type: 'SET_PHASE', payload: phase });
      },
      onLoadingChange: (loading: boolean, message: string) => {
        setIsLoading(loading);
        setLoadingMessage(message);
      },
      onEventsAdded: (events: GameEvent[]) => {
        dispatch({ type: 'ADD_EVENTS', payload: events });

        // 检查是否有战斗事件，更新战斗指示器
        const battleEvents = events.filter((e) => e.type === 'battle');
        if (battleEvents.length > 0) {
          // 简单实现：显示战斗指示器2秒
          const indicators: BattleIndicator[] = battleEvents.map((e) => ({
            connectionId: `battle_${e.id}`,
            active: true,
          }));
          setBattleIndicators(indicators);
          setTimeout(() => setBattleIndicators([]), 2000);
        }
      },
      onStateUpdate: (newState: GameState) => {
        dispatch({ type: 'LOAD_STATE', payload: newState });
      },
      onMonthAdvanced: () => {
        // 月份推进已在状态更新中处理
      },
    });
    setGameLoopController(controller);
  }, [dispatch]);

  /**
   * 加载新游戏
   * Requirements: 9.1
   */
  const loadNewGame = useCallback(() => {
    try {
      const scenarioData = createGameStateFromScenario(SCENARIO_190, DEFAULT_PLAYER_FACTION);
      dispatch({
        type: 'LOAD_SCENARIO',
        payload: {
          ...scenarioData,
          currentFaction: DEFAULT_PLAYER_FACTION,
        },
      });
      setShowOpeningNarrative(true);
    } catch (error) {
      console.error('加载游戏失败:', error);
      // 发生错误时仍然尝试设置基本状态，避免永久加载
      dispatch({
        type: 'LOAD_SCENARIO',
        payload: {
          currentFaction: DEFAULT_PLAYER_FACTION,
          cities: {},
          generals: {},
          factions: {},
          currentDate: { year: 190, month: 1 },
        },
      });
    }
  }, [dispatch]);

  /**
   * 游戏初始化
   * Requirements: 9.1, 11.8
   */
  useEffect(() => {
    // 检查是否有自动存档
    const savedInfo = storageService.getAutoSaveInfo();
    if (savedInfo) {
      setAutoSaveInfo({
        faction: savedInfo.faction,
        date: savedInfo.date,
      });
      setShowAutoSavePrompt(true);
    } else {
      // 没有存档，直接加载新游戏
      loadNewGame();
    }
  }, [loadNewGame]);

  /**
   * 恢复自动存档
   * Requirements: 11.8
   */
  const restoreAutoSave = useCallback(() => {
    const savedState = storageService.loadAutoSave();
    if (savedState) {
      dispatch({ type: 'LOAD_STATE', payload: savedState });
    }
    setShowAutoSavePrompt(false);
  }, [dispatch]);

  /**
   * 开始新游戏（忽略存档）
   */
  const startNewGame = useCallback(() => {
    storageService.clearAutoSave();
    setShowAutoSavePrompt(false);
    loadNewGame();
  }, [loadNewGame]);

  /**
   * 关闭开场叙事
   */
  const closeOpeningNarrative = useCallback(() => {
    setShowOpeningNarrative(false);
  }, []);

  /**
   * 处理城市选择
   */
  const handleCitySelect = useCallback(
    (cityId: string | null) => {
      dispatch({ type: 'SELECT_CITY', payload: cityId });
    },
    [dispatch]
  );

  /**
   * 处理动作选择
   */
  const handleActionSelect = useCallback(
    (action: ActionType) => {
      // 根据动作类型执行相应逻辑
      switch (action) {
        case 'develop_commerce':
        case 'develop_agriculture':
        case 'recruit':
        case 'search_talent':
          // 内政动作：需要选择武将，打开对话框
          if (state.actionPoints >= 1 && state.selectedCity) {
            setDomesticActionType(action);
            setShowDomesticModal(true);
          }
          break;
        case 'campaign':
          // 出征消耗2AP
          if (state.actionPoints >= 2) {
            dispatch({ type: 'DEDUCT_AP', payload: 'campaign' });
            // TODO: 执行出征逻辑
          }
          break;
        case 'view_details':
          // 查看详情（不消耗AP）
          // 打开军师对话
          setShowAdvisorDialog(true);
          break;
        case 'stratagem':
          // 计略（消耗1AP）
          if (state.actionPoints >= 1) {
            dispatch({ type: 'DEDUCT_AP', payload: 'domestic' });
            // TODO: 执行计略逻辑
          }
          break;
      }
    },
    [state.actionPoints, state.selectedCity, dispatch]
  );

  /**
   * 处理结束回合
   * Requirements: 9.6
   */
  const handleEndTurn = useCallback(async () => {
    if (!gameLoopController || isLoading) return;

    await gameLoopController.endPlayerTurn(state);
  }, [gameLoopController, state, isLoading]);

  /**
   * 打开保存对话框
   */
  const openSaveModal = useCallback(() => {
    setSaveLoadMode('save');
    setShowSaveLoadModal(true);
  }, []);

  /**
   * 打开加载对话框
   */
  const openLoadModal = useCallback(() => {
    setSaveLoadMode('load');
    setShowSaveLoadModal(true);
  }, []);

  /**
   * 处理加载存档
   */
  const handleLoadState = useCallback(
    (loadedState: GameState) => {
      dispatch({ type: 'LOAD_STATE', payload: loadedState });
    },
    [dispatch]
  );

  /**
   * 获取城市中的武将列表
   */
  const getCityGenerals = useCallback(
    (cityId: string): General[] => {
      const city = state.cities[cityId];
      if (!city) return [];
      return city.stationedGenerals
        .map((id) => state.generals[id])
        .filter((g): g is General => g !== undefined && g.isAlive);
    },
    [state.cities, state.generals]
  );

  /**
   * 处理内政执行完成
   */
  const handleDomesticExecute = useCallback(
    (result: DomesticActionResult) => {
      const city = state.cities[result.cityId];
      if (!city) return;

      // 扣除行动力
      dispatch({ type: 'DEDUCT_AP', payload: 'domestic' });

      // 根据动作类型更新状态
      switch (result.actionType) {
        case 'develop_commerce':
          if (result.success && result.value) {
            dispatch({
              type: 'UPDATE_CITY',
              payload: {
                cityId: result.cityId,
                updates: {
                  resources: {
                    ...city.resources,
                    gold: city.resources.gold - 100,
                    commerce: Math.min(999, city.resources.commerce + result.value),
                  },
                },
              },
            });
          }
          break;
        case 'develop_agriculture':
          if (result.success && result.value) {
            dispatch({
              type: 'UPDATE_CITY',
              payload: {
                cityId: result.cityId,
                updates: {
                  resources: {
                    ...city.resources,
                    gold: city.resources.gold - 100,
                    agriculture: Math.min(999, city.resources.agriculture + result.value),
                  },
                },
              },
            });
          }
          break;
        case 'recruit':
          if (result.success && result.value) {
            const goldCost = result.value * 2;
            const popCost = result.value;
            const general = state.generals[result.generalId];
            const loyaltyDecrease = Math.max(
              1,
              5 - Math.floor((general?.attributes.cha || 0) / 20)
            );

            dispatch({
              type: 'UPDATE_CITY',
              payload: {
                cityId: result.cityId,
                updates: {
                  resources: {
                    ...city.resources,
                    gold: city.resources.gold - goldCost,
                    population: city.resources.population - popCost,
                    loyalty: Math.max(0, city.resources.loyalty - loyaltyDecrease),
                  },
                },
              },
            });
            dispatch({
              type: 'UPDATE_GENERAL',
              payload: {
                generalId: result.generalId,
                updates: {
                  troops: (state.generals[result.generalId]?.troops || 0) + result.value,
                },
              },
            });
          }
          break;
        case 'search_talent':
          // 人才探索成功时，可以添加新武将（简化处理：只添加事件）
          break;
      }

      // 添加事件到日志
      const event: GameEvent = {
        id: `domestic_${Date.now()}`,
        type: 'domestic',
        timestamp: { ...state.currentDate },
        data: {
          city: result.cityId,
          action: result.actionType,
          executor: result.generalId,
          value: result.value || 0,
        } as DomesticEventData,
        narrative: result.message,
      };
      dispatch({ type: 'ADD_EVENT', payload: event });

      // 关闭对话框
      setShowDomesticModal(false);
      setDomesticActionType(null);
    },
    [state.cities, state.generals, state.currentDate, dispatch]
  );

  const playerFaction = state.factions[state.currentFaction];
  const selectedCityData = state.selectedCity ? state.cities[state.selectedCity] : null;
  const selectedCityFaction = selectedCityData
    ? state.factions[selectedCityData.faction]
    : undefined;
  const selectedCityGenerals = selectedCityData ? getCityGenerals(selectedCityData.id) : [];
  const isPlayerCity = selectedCityData ? selectedCityData.faction === state.currentFaction : false;

  const { totalGold, totalGrain, totalTroops } = useMemo(() => {
    if (!playerFaction) {
      return { totalGold: 0, totalGrain: 0, totalTroops: 0 };
    }

    let gold = 0;
    let grain = 0;
    let troops = 0;

    for (const cityId of playerFaction.cities) {
      const city = state.cities[cityId];
      if (city) {
        gold += city.resources.gold;
        grain += city.resources.grain;
      }
    }

    for (const generalId of playerFaction.generals) {
      const general = state.generals[generalId];
      if (general && general.isAlive) {
        troops += general.troops;
      }
    }

    return { totalGold: gold, totalGrain: grain, totalTroops: troops };
  }, [playerFaction, state.cities, state.generals]);

  // 如果游戏状态未加载，显示加载中
  if (!state.currentFaction) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" />
        <div className="loading-text">正在加载游戏...</div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* 自动存档恢复提示 */}
      {showAutoSavePrompt && autoSaveInfo && (
        <div className="autosave-prompt-overlay">
          <div className="autosave-prompt-dialog">
            <h2 className="autosave-prompt-title">发现存档</h2>
            <div className="autosave-prompt-info">
              <p>势力：{autoSaveInfo.faction}</p>
              <p>
                日期：{autoSaveInfo.date.year}年{autoSaveInfo.date.month}月
              </p>
            </div>
            <div className="autosave-prompt-buttons">
              <button className="autosave-prompt-button primary" onClick={restoreAutoSave}>
                继续游戏
              </button>
              <button className="autosave-prompt-button secondary" onClick={startNewGame}>
                开始新游戏
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 开场叙事 */}
      {showOpeningNarrative && (
        <div className="opening-narrative-overlay">
          <div className="opening-narrative-dialog">
            <h1 className="opening-narrative-title">群雄割据</h1>
            <div className="opening-narrative-content">
              {OPENING_NARRATIVE.split('\n\n').map((paragraph, index) => (
                <p key={index} style={{ marginBottom: '16px' }}>
                  {paragraph}
                </p>
              ))}
            </div>
            <button className="opening-narrative-button" onClick={closeOpeningNarrative}>
              开始游戏
            </button>
          </div>
        </div>
      )}

      {/* 加载遮罩 */}
      {isLoading && shouldShowLoading(state.phase) && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div className="loading-text">{loadingMessage}</div>
        </div>
      )}

      <GameHeader currentTurn={state.currentDate} factionName={playerFaction?.name || '未知势力'} />

      {/* 主游戏区域 */}
      <div className="game-main">
        <div className="left-sidebar">
          {playerFaction && (
            <FactionPanel
              faction={playerFaction}
              actionPoints={state.actionPoints}
              maxActionPoints={INITIAL_ACTION_POINTS}
              totalGold={totalGold}
              totalFood={totalGrain}
              totalTroops={totalTroops}
            />
          )}

          {selectedCityData && (
            <CityPanel
              city={selectedCityData}
              faction={selectedCityFaction}
              generals={selectedCityGenerals}
            />
          )}

          <ActionsPanel
            actionPoints={state.actionPoints}
            onAction={handleActionSelect}
            onEndTurn={handleEndTurn}
            onSave={openSaveModal}
            onLoad={openLoadModal}
            hasSelectedCity={!!selectedCityData}
            isPlayerCity={isPlayerCity}
          />
        </div>

        <div className="map-container">
          <StrategicMap
            cities={Object.values(state.cities)}
            factions={state.factions}
            selectedCityId={state.selectedCity}
            battleIndicators={battleIndicators}
            onCitySelect={(cityId) => handleCitySelect(cityId)}
          />
        </div>

        <div className="right-sidebar">
          <NewsPanel events={state.eventLog} />
        </div>
      </div>

      {/* 军师对话框 */}
      {showAdvisorDialog && (
        <AdvisorDialog
          isOpen={showAdvisorDialog}
          onClose={() => setShowAdvisorDialog(false)}
          currentCity={state.selectedCity ? state.cities[state.selectedCity] : null}
          allCities={state.cities}
          factions={state.factions}
          generals={state.generals}
          playerFactionId={state.currentFaction}
          currentDate={state.currentDate}
        />
      )}

      {/* 存档/读档模态框 */}
      <SaveLoadModal
        isOpen={showSaveLoadModal}
        onClose={() => setShowSaveLoadModal(false)}
        currentState={state}
        onLoad={handleLoadState}
        mode={saveLoadMode}
      />

      {/* 内政执行对话框 */}
      {showDomesticModal && domesticActionType && state.selectedCity && (
        <DomesticActionModal
          isOpen={showDomesticModal}
          onClose={() => {
            setShowDomesticModal(false);
            setDomesticActionType(null);
          }}
          onExecute={handleDomesticExecute}
          actionType={domesticActionType}
          city={state.cities[state.selectedCity]}
          generals={getCityGenerals(state.selectedCity)}
        />
      )}
    </div>
  );
}

/**
 * 应用根组件
 */
function App() {
  return (
    <GameStateProvider>
      <GameMain />
    </GameStateProvider>
  );
}

export default App;
