/**
 * 拓扑地图组件
 * 使用SVG渲染城市节点和道路连线
 * @module components/MapView/TopologyMap
 */

import { useMemo, useState, useCallback, useRef } from 'react';
import type { City } from '../../types/city';
import type { Faction } from '../../types/faction';
import './TopologyMap.css';

/**
 * 城市节点大小映射
 */
export const CITY_SCALE_RADIUS = {
  small: 20,
  medium: 30,
  large: 40,
} as const;

/**
 * 战斗指示器接口
 */
export interface BattleIndicator {
  /** 连接ID (格式: cityId1-cityId2) */
  connectionId: string;
  /** 是否激活 */
  active: boolean;
}

/**
 * 地图视图属性
 */
export interface TopologyMapProps {
  /** 城市列表 */
  cities: City[];
  /** 势力映射 */
  factions: Record<string, Faction>;
  /** 当前选中城市ID */
  selectedCityId: string | null;
  /** 战斗指示器列表 */
  battleIndicators?: BattleIndicator[];
  /** 城市悬停回调 */
  onCityHover?: (cityId: string | null) => void;
  /** 城市点击回调 */
  onCityClick?: (cityId: string) => void;
  /** 城市易主动画城市ID列表 */
  animatingCities?: string[];
}

/**
 * 提示框位置接口
 */
interface TooltipPosition {
  x: number;
  y: number;
}

/**
 * 道路连接接口
 */
interface RoadConnection {
  id: string;
  from: City;
  to: City;
}

/**
 * 获取城市节点颜色
 * 根据城市所属势力返回对应颜色
 */
export function getCityNodeColor(city: City, factions: Record<string, Faction>): string {
  const faction = factions[city.faction];
  return faction?.color || '#666666';
}

/**
 * 生成连接ID
 * 确保ID唯一性（按字母顺序排序）
 */
function generateConnectionId(cityId1: string, cityId2: string): string {
  return [cityId1, cityId2].sort().join('-');
}

/**
 * 提取唯一的道路连接
 */
function extractRoadConnections(cities: City[]): RoadConnection[] {
  const connections: RoadConnection[] = [];
  const processedIds = new Set<string>();
  const cityMap = new Map(cities.map(c => [c.id, c]));

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

/**
 * 拓扑地图组件
 */
export function TopologyMap({
  cities,
  factions,
  selectedCityId,
  battleIndicators = [],
  onCityHover,
  onCityClick,
  animatingCities = [],
}: TopologyMapProps) {
  // 提示框状态
  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 提取道路连接
  const roadConnections = useMemo(() => extractRoadConnections(cities), [cities]);

  // 创建战斗指示器映射
  const battleIndicatorMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const indicator of battleIndicators) {
      map.set(indicator.connectionId, indicator.active);
    }
    return map;
  }, [battleIndicators]);

  // 创建城市映射
  const cityMap = useMemo(() => {
    return new Map(cities.map(c => [c.id, c]));
  }, [cities]);

  // 获取悬停的城市数据
  const hoveredCity = hoveredCityId ? cityMap.get(hoveredCityId) : null;
  const hoveredFaction = hoveredCity ? factions[hoveredCity.faction] : null;

  // 处理城市悬停
  const handleCityMouseEnter = useCallback((cityId: string, event: React.MouseEvent) => {
    setHoveredCityId(cityId);
    onCityHover?.(cityId);
    
    // 计算提示框位置
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: event.clientX - rect.left + 15,
        y: event.clientY - rect.top - 10,
      });
    }
  }, [onCityHover]);

  const handleCityMouseLeave = useCallback(() => {
    setHoveredCityId(null);
    onCityHover?.(null);
  }, [onCityHover]);

  const handleCityMouseMove = useCallback((event: React.MouseEvent) => {
    if (containerRef.current && hoveredCityId) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: event.clientX - rect.left + 15,
        y: event.clientY - rect.top - 10,
      });
    }
  }, [hoveredCityId]);

  // 计算视图边界
  const viewBox = useMemo(() => {
    if (cities.length === 0) {
      return '0 0 800 600';
    }
    
    const padding = 60;
    const xs = cities.map(c => c.position.x);
    const ys = cities.map(c => c.position.y);
    const minX = Math.min(...xs) - padding;
    const minY = Math.min(...ys) - padding;
    const maxX = Math.max(...xs) + padding;
    const maxY = Math.max(...ys) + padding;
    
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [cities]);

  return (
    <div className="topology-map-container" ref={containerRef}>
      <svg
        className="topology-map"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 道路连线层 */}
        <g className="roads-layer">
          {roadConnections.map((connection) => {
            const hasBattle = battleIndicatorMap.get(connection.id);
            return (
              <g key={connection.id} className="road-connection">
                <line
                  x1={connection.from.position.x}
                  y1={connection.from.position.y}
                  x2={connection.to.position.x}
                  y2={connection.to.position.y}
                  className={`road-line ${hasBattle ? 'road-line--battle' : ''}`}
                />
                {/* 战斗图标 */}
                {hasBattle && (
                  <g
                    className="battle-indicator"
                    transform={`translate(${(connection.from.position.x + connection.to.position.x) / 2}, ${(connection.from.position.y + connection.to.position.y) / 2})`}
                  >
                    <circle r="12" className="battle-indicator-bg" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="battle-indicator-icon"
                    >
                      ⚔
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* 城市节点层 */}
        <g className="cities-layer">
          {cities.map((city) => {
            const radius = CITY_SCALE_RADIUS[city.scale];
            const color = getCityNodeColor(city, factions);
            const isSelected = city.id === selectedCityId;
            const isAnimating = animatingCities.includes(city.id);

            return (
              <g
                key={city.id}
                className={`city-node ${isSelected ? 'city-node--selected' : ''}`}
                transform={`translate(${city.position.x}, ${city.position.y})`}
                onMouseEnter={(e) => handleCityMouseEnter(city.id, e)}
                onMouseLeave={handleCityMouseLeave}
                onMouseMove={handleCityMouseMove}
                onClick={() => onCityClick?.(city.id)}
                data-city-id={city.id}
                data-faction-id={city.faction}
              >
                {/* 选中光环 */}
                {isSelected && (
                  <circle
                    r={radius + 6}
                    className="city-node-selection-ring"
                  />
                )}
                
                {/* 城市圆形节点 */}
                <circle
                  r={radius}
                  fill={color}
                  className={`city-node-circle ${isAnimating ? 'faction-change' : ''}`}
                />
                
                {/* 城市名称 */}
                <text
                  y={radius + 16}
                  textAnchor="middle"
                  className="city-node-label"
                >
                  {city.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* 城市提示框 */}
      {hoveredCity && (
        <div
          className="city-tooltip"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <div className="city-tooltip-header">
            <span
              className="city-tooltip-faction-dot"
              style={{ backgroundColor: hoveredFaction?.color || '#666' }}
            />
            <span className="city-tooltip-name">{hoveredCity.name}</span>
            <span className="city-tooltip-faction-name">
              ({hoveredFaction?.name || '无主'})
            </span>
          </div>
          <div className="city-tooltip-info">
            <div className="city-tooltip-row">
              <span>人口:</span>
              <span>{hoveredCity.resources.population.toLocaleString()}</span>
            </div>
            <div className="city-tooltip-row">
              <span>防御:</span>
              <span>{hoveredCity.resources.defense}</span>
            </div>
            <div className="city-tooltip-row">
              <span>规模:</span>
              <span>
                {hoveredCity.scale === 'large' ? '大城' : 
                 hoveredCity.scale === 'medium' ? '中城' : '小城'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TopologyMap;
