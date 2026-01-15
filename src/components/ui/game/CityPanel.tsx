/**
 * 城市详情面板 - 像素风格
 */

import type { CSSProperties } from 'react';
import type { City } from '../../../types/city';
import type { General } from '../../../types/general';
import type { Faction } from '../../../types/faction';

interface CityPanelProps {
  city: City;
  faction: Faction | undefined;
  generals: General[];
}

export function CityPanel({ city, faction, generals }: CityPanelProps) {
  const sizeLabels: Record<string, string> = {
    large: '大城',
    medium: '中城',
    small: '小城',
  };

  const statColors: Record<string, string> = {
    population: '#8b5cf6',
    commerce: '#f59e0b',
    agriculture: '#22c55e',
    defense: '#ef4444',
    loyalty: '#3b82f6',
  };

  const stats = [
    { key: 'population', label: '人口', value: city.resources.population, max: 100000 },
    { key: 'commerce', label: '商业', value: city.resources.commerce, max: 999 },
    { key: 'agriculture', label: '农业', value: city.resources.agriculture, max: 999 },
    { key: 'defense', label: '防御', value: city.resources.defense, max: 100 },
    { key: 'loyalty', label: '民心', value: city.resources.loyalty, max: 100 },
  ];

  return (
    <div className="city-panel">
      <div className="city-header">
        <h3 className="city-name">
          <span
            className="city-faction-dot"
            style={{ backgroundColor: faction?.color || '#888' }}
          />
          {city.name}
        </h3>
        <span className="city-size">{sizeLabels[city.scale]}</span>
      </div>

      <div className="city-stats">
        {stats.map((stat) => (
          <div key={stat.key} className="stat-row">
            <div className="stat-header">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">
                {stat.key === 'population' ? stat.value.toLocaleString() : stat.value}
              </span>
            </div>
            <div className="stat-bar">
              <div
                className="stat-fill"
                style={
                  {
                    width: `${(stat.value / stat.max) * 100}%`,
                    '--stat-color': statColors[stat.key],
                  } as CSSProperties
                }
              />
            </div>
          </div>
        ))}
      </div>

      <div className="generals-section">
        <h3>
          <span>🎖️</span>
          驻守武将 ({generals.length})
        </h3>
        <div className="generals-list">
          {generals.map((general) => (
            <div key={general.id} className="general-card">
              <div className="general-avatar">⚔</div>
              <div className="general-info">
                <div className="general-name">{general.name}</div>
                <div className="general-stats">
                  统{general.attributes.lead} 武{general.attributes.war} 智{general.attributes.int}
                </div>
              </div>
              <div className="general-troops">
                <span>⚔️</span>
                {general.troops.toLocaleString()}
              </div>
            </div>
          ))}
          {generals.length === 0 && (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            >
              暂无驻守武将
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
