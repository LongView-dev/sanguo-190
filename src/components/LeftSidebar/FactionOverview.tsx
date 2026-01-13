/**
 * 势力概况组件
 * 显示君主头像、资金、粮草、兵力、日期
 * @module components/LeftSidebar/FactionOverview
 */

import type { GameTimestamp } from '../../types/events';
import { RESOURCE_ICONS, getGeneralPortrait, getFactionBanner } from '../../assets';

/**
 * 势力概况组件属性
 */
export interface FactionOverviewProps {
  /** 君主名称 */
  lordName: string;
  /** 君主ID (用于获取头像) */
  lordId?: string;
  /** 势力ID (用于获取旗帜) */
  factionId?: string;
  /** 君主头像URL (可选，用于覆盖默认) */
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
 * 资源图标组件
 */
function ResourceIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className="resource-icon-img"
      loading="lazy"
    />
  );
}

/**
 * 势力概况组件
 * 显示玩家势力的基本信息概览
 */
export function FactionOverview({
  lordName,
  lordId,
  factionId,
  lordPortrait,
  totalGold,
  totalGrain,
  totalTroops,
  currentDate,
  factionColor,
}: FactionOverviewProps) {
  // 获取君主头像（优先使用传入的，否则根据ID获取）
  const portrait = lordPortrait || (lordId ? getGeneralPortrait(lordId) : undefined);
  // 获取势力旗帜
  const banner = factionId ? getFactionBanner(factionId) : undefined;

  return (
    <div className="faction-overview" style={{ borderColor: factionColor }}>
      {/* 势力旗帜背景 */}
      {banner && (
        <div
          className="faction-banner-bg"
          style={{ backgroundImage: `url(${banner})` }}
        />
      )}

      {/* 君主信息 */}
      <div className="lord-info">
        <div
          className="lord-portrait"
          style={{
            backgroundColor: portrait ? 'transparent' : factionColor,
          }}
        >
          {portrait ? (
            <img src={portrait} alt={lordName} className="lord-portrait-img" />
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
          <ResourceIcon src={RESOURCE_ICONS.gold} alt="资金" />
          <span className="resource-label">资金</span>
          <span className="resource-value">{formatNumber(totalGold)}</span>
        </div>
        <div className="resource-item">
          <ResourceIcon src={RESOURCE_ICONS.grain} alt="粮草" />
          <span className="resource-label">粮草</span>
          <span className="resource-value">{formatNumber(totalGrain)}</span>
        </div>
        <div className="resource-item">
          <ResourceIcon src={RESOURCE_ICONS.troops} alt="兵力" />
          <span className="resource-label">兵力</span>
          <span className="resource-value">{formatNumber(totalTroops)}</span>
        </div>
      </div>
    </div>
  );
}

export default FactionOverview;
