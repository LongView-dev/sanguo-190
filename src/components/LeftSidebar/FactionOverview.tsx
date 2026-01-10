/**
 * 势力概况组件
 * 显示君主头像、资金、粮草、兵力、日期
 * @module components/LeftSidebar/FactionOverview
 */

import type { GameTimestamp } from '../../types/events';

/**
 * 势力概况组件属性
 */
export interface FactionOverviewProps {
  /** 君主名称 */
  lordName: string;
  /** 君主头像URL (可选) */
  lordPortrait?: string;
  /** 总资金 */
  totalGold: number;
  /** 总粮草 */
  totalGrain: number;
  /** 总兵力 */
  totalTroops: number;
  /** 当前日期 */
  currentDate: GameTimestamp;
  /** 势力颜色 */
  factionColor: string;
}

/**
 * 格式化数字为带千分位的字符串
 */
function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

/**
 * 势力概况组件
 * 显示玩家势力的基本信息概览
 */
export function FactionOverview({
  lordName,
  lordPortrait,
  totalGold,
  totalGrain,
  totalTroops,
  currentDate,
  factionColor,
}: FactionOverviewProps) {
  return (
    <div className="faction-overview" style={{ borderColor: factionColor }}>
      {/* 君主信息 */}
      <div className="lord-info">
        <div
          className="lord-portrait"
          style={{
            backgroundColor: lordPortrait ? 'transparent' : factionColor,
          }}
        >
          {lordPortrait ? (
            <img src={lordPortrait} alt={lordName} />
          ) : (
            <span className="lord-initial">{lordName.charAt(0)}</span>
          )}
        </div>
        <div className="lord-name">{lordName}</div>
      </div>

      {/* 日期显示 */}
      <div className="date-display">
        <span className="date-year">{currentDate.year}年</span>
        <span className="date-month">{currentDate.month}月</span>
      </div>

      {/* 资源统计 */}
      <div className="resource-stats">
        <div className="resource-item">
          <span className="resource-icon">💰</span>
          <span className="resource-label">资金</span>
          <span className="resource-value">{formatNumber(totalGold)}</span>
        </div>
        <div className="resource-item">
          <span className="resource-icon">🌾</span>
          <span className="resource-label">粮草</span>
          <span className="resource-value">{formatNumber(totalGrain)}</span>
        </div>
        <div className="resource-item">
          <span className="resource-icon">⚔️</span>
          <span className="resource-label">兵力</span>
          <span className="resource-value">{formatNumber(totalTroops)}</span>
        </div>
      </div>
    </div>
  );
}

export default FactionOverview;
