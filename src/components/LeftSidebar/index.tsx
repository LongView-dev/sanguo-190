/**
 * 左侧栏组件
 * 整合势力概况、城市详情、指令菜单
 * @module components/LeftSidebar
 */

import { FactionOverview } from './FactionOverview';
import { CityDetails } from './CityDetails';
import { ActionMenu, type ActionType } from './ActionMenu';
import type { GameState } from '../../types/gameState';
import type { City } from '../../types/city';
import type { General } from '../../types/general';
import type { Faction } from '../../types/faction';

import './FactionOverview.css';
import './CityDetails.css';
import './ActionMenu.css';
import './LeftSidebar.css';

/**
 * 左侧栏组件属性
 */
export interface LeftSidebarProps {
  /** 游戏状态 */
  gameState: GameState;
  /** 动作选择回调 */
  onActionSelect: (action: ActionType) => void;
  /** 结束回合回调 */
  onEndTurn: () => void;
  /** 保存游戏回调 */
  onSave?: () => void;
  /** 加载游戏回调 */
  onLoad?: () => void;
}

/**
 * 计算势力总资源
 */
function calculateFactionTotals(
  faction: Faction,
  cities: Record<string, City>,
  generals: Record<string, General>
): { totalGold: number; totalGrain: number; totalTroops: number } {
  let totalGold = 0;
  let totalGrain = 0;
  let totalTroops = 0;

  // 累加城市资源
  for (const cityId of faction.cities) {
    const city = cities[cityId];
    if (city) {
      totalGold += city.resources.gold;
      totalGrain += city.resources.grain;
    }
  }

  // 累加武将兵力
  for (const generalId of faction.generals) {
    const general = generals[generalId];
    if (general && general.isAlive) {
      totalTroops += general.troops;
    }
  }

  return { totalGold, totalGrain, totalTroops };
}

/**
 * 左侧栏组件
 */
export function LeftSidebar({
  gameState,
  onActionSelect,
  onEndTurn,
  onSave,
  onLoad,
}: LeftSidebarProps) {
  const { currentFaction, cities, generals, factions, selectedCity, actionPoints, currentDate } =
    gameState;

  const playerFaction = factions[currentFaction];
  if (!playerFaction) {
    return <div className="left-sidebar">加载中...</div>;
  }

  const lord = generals[playerFaction.lordId];
  const { totalGold, totalGrain, totalTroops } = calculateFactionTotals(
    playerFaction,
    cities,
    generals
  );

  // 获取选中城市信息
  const selectedCityData = selectedCity ? cities[selectedCity] : null;
  const isPlayerCity = selectedCityData
    ? selectedCityData.faction === currentFaction
    : false;

  // 获取驻守武将
  const stationedGenerals = selectedCityData
    ? selectedCityData.stationedGenerals
        .map((id) => generals[id])
        .filter((g): g is General => g !== undefined && g.isAlive)
    : [];

  // 获取城市势力颜色
  const cityFactionColor = selectedCityData
    ? factions[selectedCityData.faction]?.color || '#666'
    : '#666';

  return (
    <div className="left-sidebar">
      {/* 势力概况 */}
      <FactionOverview
        lordName={lord?.name || playerFaction.name}
        totalGold={totalGold}
        totalGrain={totalGrain}
        totalTroops={totalTroops}
        currentDate={currentDate}
        factionColor={playerFaction.color}
      />

      {/* 城市详情 */}
      {selectedCityData && (
        <CityDetails
          city={selectedCityData}
          stationedGenerals={stationedGenerals}
          factionColor={cityFactionColor}
          isPlayerCity={isPlayerCity}
        />
      )}

      {/* 指令菜单 */}
      <ActionMenu
        isPlayerCity={isPlayerCity}
        currentAP={actionPoints}
        hasSelectedCity={!!selectedCityData}
        onActionSelect={onActionSelect}
        onEndTurn={onEndTurn}
        onSave={onSave}
        onLoad={onLoad}
      />
    </div>
  );
}

// 导出子组件和类型
export { FactionOverview } from './FactionOverview';
export { CityDetails } from './CityDetails';
export { ActionMenu, getMenuItemsForCity, getPlayerCityMenuItems, getEnemyCityMenuItems } from './ActionMenu';
export type { FactionOverviewProps } from './FactionOverview';
export type { CityDetailsProps } from './CityDetails';
export type { ActionMenuProps, ActionMenuItem, ActionType } from './ActionMenu';

export default LeftSidebar;
