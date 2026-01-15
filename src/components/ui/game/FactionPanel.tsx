/**
 * 势力信息面板 - 像素风格
 */

import type { CSSProperties } from 'react';
import type { Faction } from '../../../types/faction';

interface FactionPanelProps {
  faction: Faction;
  actionPoints: number;
  maxActionPoints: number;
  totalGold: number;
  totalFood: number;
  totalTroops: number;
}

export function FactionPanel({
  faction,
  actionPoints,
  maxActionPoints,
  totalGold,
  totalFood,
  totalTroops,
}: FactionPanelProps) {
  return (
    <div className="faction-panel">
      <div className="faction-header">
        <div
          className="faction-avatar"
          style={
            {
              '--faction-color': faction.color,
              borderColor: faction.color,
            } as CSSProperties
          }
        >
          {faction.name[0]}
        </div>
        <div className="faction-info">
          <h2 style={{ color: faction.color }}>{faction.name}</h2>
          <p className="faction-subtitle">诸侯</p>
        </div>
      </div>

      <div className="resources-grid">
        <div className="resource-item">
          {/* 像素风金币图标 */}
          <svg className="resource-icon" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#c9a227" />
            <circle cx="12" cy="12" r="8" fill="#ffd700" />
            <circle cx="12" cy="12" r="6" fill="#c9a227" />
            <rect x="10" y="8" width="4" height="8" fill="#ffd700" />
          </svg>
          <span className="resource-value">{totalGold.toLocaleString()}</span>
          <span className="resource-label">金钱</span>
        </div>
        <div className="resource-item">
          {/* 像素风粮草图标 */}
          <svg className="resource-icon" width="24" height="24" viewBox="0 0 24 24">
            <rect x="10" y="14" width="4" height="8" fill="#8b7355" />
            <ellipse cx="12" cy="8" rx="6" ry="8" fill="#22c55e" />
            <ellipse cx="12" cy="8" rx="4" ry="6" fill="#4ade80" />
            <rect x="11" y="4" width="2" height="12" fill="#166534" />
          </svg>
          <span className="resource-value">{totalFood.toLocaleString()}</span>
          <span className="resource-label">粮草</span>
        </div>
        <div className="resource-item">
          {/* 像素风兵力图标 */}
          <svg className="resource-icon" width="24" height="24" viewBox="0 0 24 24">
            <rect x="10" y="4" width="4" height="16" fill="#64748b" />
            <rect x="11" y="5" width="2" height="14" fill="#94a3b8" />
            <polygon points="12,0 6,8 18,8" fill="#dc2626" />
            <polygon points="12,2 8,8 16,8" fill="#ef4444" />
            <rect x="8" y="18" width="8" height="4" fill="#5a4a3a" />
          </svg>
          <span className="resource-value">{totalTroops.toLocaleString()}</span>
          <span className="resource-label">兵力</span>
        </div>
      </div>

      <div className="action-points">
        <div className="ap-header">
          <span className="ap-label">行动力</span>
          <span className="ap-value">
            {actionPoints}/{maxActionPoints} AP
          </span>
        </div>
        <div className="ap-bar">
          {Array.from({ length: maxActionPoints }).map((_, i) => (
            <div key={i} className={`ap-pip ${i < actionPoints ? 'active' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
