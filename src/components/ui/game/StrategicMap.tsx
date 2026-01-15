/**
 * 像素风战略地图
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import type { City } from '../../../types/city';
import type { Faction } from '../../../types/faction';
import type { BattleIndicator } from '../../MapView/TopologyMap';

interface StrategicMapProps {
  cities: City[];
  factions: Record<string, Faction>;
  selectedCityId: string | null;
  battleIndicators?: BattleIndicator[];
  onCitySelect: (cityId: string) => void;
}

interface TooltipState {
  show: boolean;
  x: number;
  y: number;
  city: City | null;
}

interface RoadConnection {
  id: string;
  from: City;
  to: City;
}

function generateConnectionId(cityId1: string, cityId2: string): string {
  return [cityId1, cityId2].sort().join('-');
}

function extractRoadConnections(cities: City[]): RoadConnection[] {
  const connections: RoadConnection[] = [];
  const processedIds = new Set<string>();
  const cityMap = new Map(cities.map((city) => [city.id, city]));

  for (const city of cities) {
    for (const connectedId of city.connectedCities) {
      const connectionId = generateConnectionId(city.id, connectedId);
      if (!processedIds.has(connectionId)) {
        const connectedCity = cityMap.get(connectedId);
        if (connectedCity) {
          connections.push({
            id: connectionId,
            from: city,
            to: connectedCity,
          });
          processedIds.add(connectionId);
        }
      }
    }
  }

  return connections;
}

function PixelCityIcon({
  size,
  color,
  x,
  y,
}: {
  size: City['scale'];
  color: string;
  x: number;
  y: number;
}) {
  if (size === 'large') {
    return (
      <g transform={`translate(${x - 24}, ${y - 24})`}>
        <rect x="4" y="32" width="40" height="12" fill="#3a3a3a" />
        <rect x="6" y="34" width="36" height="8" fill="#2a2a2a" />

        <rect x="12" y="8" width="24" height="24" fill={color} />
        <rect x="14" y="10" width="20" height="20" fill={`${color}dd`} />

        <polygon points="24,0 8,10 40,10" fill={color} />
        <polygon points="24,2 12,10 36,10" fill={`${color}88`} />

        <rect x="18" y="22" width="12" height="10" fill="#1a1a1a" />
        <rect x="20" y="24" width="8" height="6" fill="#2a2a2a" />

        <rect x="2" y="16" width="10" height="16" fill={color} />
        <polygon points="7,10 0,18 14,18" fill={color} />
        <rect x="4" y="22" width="6" height="4" fill="#1a1a1a" />

        <rect x="36" y="16" width="10" height="16" fill={color} />
        <polygon points="41,10 34,18 48,18" fill={color} />
        <rect x="38" y="22" width="6" height="4" fill="#1a1a1a" />

        <rect x="23" y="-8" width="2" height="10" fill="#5a4a3a" />
        <polygon points="25,-8 25,0 35,-4" fill={color} />

        <rect x="14" y="10" width="2" height="20" fill="rgba(255,255,255,0.2)" />
        <rect x="4" y="18" width="2" height="14" fill="rgba(255,255,255,0.2)" />
        <rect x="38" y="18" width="2" height="14" fill="rgba(255,255,255,0.2)" />
      </g>
    );
  }

  if (size === 'medium') {
    return (
      <g transform={`translate(${x - 18}, ${y - 18})`}>
        <rect x="2" y="26" width="32" height="8" fill="#3a3a3a" />
        <rect x="4" y="28" width="28" height="4" fill="#2a2a2a" />

        <rect x="8" y="8" width="20" height="18" fill={color} />
        <rect x="10" y="10" width="16" height="14" fill={`${color}dd`} />

        <polygon points="18,0 4,10 32,10" fill={color} />
        <polygon points="18,2 8,10 28,10" fill={`${color}88`} />

        <rect x="13" y="18" width="10" height="8" fill="#1a1a1a" />
        <rect x="15" y="20" width="6" height="4" fill="#2a2a2a" />

        <rect x="0" y="14" width="6" height="12" fill={color} />
        <rect x="30" y="14" width="6" height="12" fill={color} />

        <rect x="17" y="-4" width="2" height="6" fill="#5a4a3a" />
        <polygon points="19,-4 19,0 27,-2" fill={color} />

        <rect x="10" y="10" width="2" height="14" fill="rgba(255,255,255,0.2)" />
      </g>
    );
  }

  return (
    <g transform={`translate(${x - 12}, ${y - 12})`}>
      <rect x="2" y="18" width="20" height="6" fill="#3a3a3a" />

      <rect x="4" y="6" width="16" height="12" fill={color} />
      <rect x="6" y="8" width="12" height="8" fill={`${color}dd`} />

      <polygon points="12,0 2,8 22,8" fill={color} />
      <polygon points="12,2 6,8 18,8" fill={`${color}88`} />

      <rect x="9" y="12" width="6" height="6" fill="#1a1a1a" />

      <rect x="6" y="8" width="2" height="8" fill="rgba(255,255,255,0.2)" />
    </g>
  );
}

export function StrategicMap({
  cities,
  factions,
  selectedCityId,
  battleIndicators = [],
  onCitySelect,
}: StrategicMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    show: false,
    x: 0,
    y: 0,
    city: null,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const roadConnections = useMemo(() => extractRoadConnections(cities), [cities]);

  const battleIndicatorMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const indicator of battleIndicators) {
      map.set(indicator.connectionId, indicator.active);
    }
    return map;
  }, [battleIndicators]);

  const getFactionColor = useCallback(
    (factionId: string) => factions[factionId]?.color || '#888',
    [factions]
  );

  const handleMouseEnter = useCallback((event: React.MouseEvent, city: City) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setTooltip({
      show: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      city,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, show: false }));
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setTooltip((prev) => ({
      ...prev,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }));
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg className="strategic-map" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
        <g opacity="0.15">
          <polygon points="50,450 100,380 150,430 200,350 250,420 300,380 350,450" fill="#4a4a4a" />
          <polygon points="50,450 100,390 150,440 200,360 250,430 300,390 350,450" fill="#3a3a3a" />
          <polygon
            points="500,500 550,420 600,480 650,400 700,470 750,420 800,500"
            fill="#4a4a4a"
          />
          <polygon
            points="500,500 550,430 600,490 650,410 700,480 750,430 800,500"
            fill="#3a3a3a"
          />
          <polygon
            points="200,100 250,50 300,80 350,30 400,70 450,40 500,90 550,100"
            fill="#4a4a4a"
          />
        </g>

        {roadConnections.map((road) => (
          <line
            key={road.id}
            className={`road ${battleIndicatorMap.get(road.id) ? 'battle' : ''}`}
            x1={road.from.position.x}
            y1={road.from.position.y}
            x2={road.to.position.x}
            y2={road.to.position.y}
          />
        ))}

        {cities.map((city) => {
          const isSelected = selectedCityId === city.id;
          const color = getFactionColor(city.faction);

          return (
            <g
              key={city.id}
              className={`city-node ${isSelected ? 'selected' : ''}`}
              onClick={() => onCitySelect(city.id)}
              onMouseEnter={(event) => handleMouseEnter(event, city)}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
            >
              <ellipse
                cx={city.position.x}
                cy={city.position.y + 20}
                rx={city.scale === 'large' ? 28 : city.scale === 'medium' ? 20 : 14}
                ry="6"
                fill="rgba(0,0,0,0.3)"
              />

              <PixelCityIcon
                size={city.scale}
                color={color}
                x={city.position.x}
                y={city.position.y}
              />

              <g
                transform={`translate(${city.position.x}, ${city.position.y + (city.scale === 'large' ? 42 : city.scale === 'medium' ? 36 : 28)})`}
              >
                <rect
                  x="-30"
                  y="-2"
                  width="60"
                  height="18"
                  fill="rgba(10, 10, 18, 0.9)"
                  stroke={isSelected ? '#c9a227' : 'rgba(255,255,255,0.2)'}
                  strokeWidth="2"
                />
                <text
                  className="city-label"
                  y="12"
                  style={{
                    fontSize: '12px',
                    fontFamily: 'Courier New, monospace',
                    letterSpacing: '2px',
                    fill: '#fff',
                    textAnchor: 'middle',
                  }}
                >
                  {city.name}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {tooltip.show && tooltip.city && (
        <div
          className="tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -110%)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#c9a227' }}>
            {tooltip.city.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
            人口: {tooltip.city.resources.population.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            驻军: {tooltip.city.stationedGenerals.length} 将
          </div>
        </div>
      )}
    </div>
  );
}
