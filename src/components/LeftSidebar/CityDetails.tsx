/**
 * 城市详情组件
 * 显示城市人口、防御、商业、农业、驻守武将
 * @module components/LeftSidebar/CityDetails
 */

import type { City } from '../../types/city';
import type { General } from '../../types/general';
import { RESOURCE_ICONS, getGeneralPortrait, getCityImage } from '../../assets';

/**
 * 城市详情组件属性
 */
export interface CityDetailsProps {
  /** 城市数据 */
  city: City;
  /** 驻守武将列表 */
  stationedGenerals: General[];
  /** 势力颜色 */
  factionColor: string;
  /** 是否为玩家城市 */
  isPlayerCity: boolean;
}

/**
 * 格式化数字为带千分位的字符串
 */
function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

/**
 * 获取城市规模显示文本
 */
function getScaleText(scale: City['scale']): string {
  switch (scale) {
    case 'large':
      return '大城';
    case 'medium':
      return '中城';
    case 'small':
      return '小城';
  }
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
 * 城市详情组件
 * 显示选中城市的详细信息
 */
export function CityDetails({
  city,
  stationedGenerals,
  factionColor,
  isPlayerCity,
}: CityDetailsProps) {
  const { resources } = city;
  const cityImage = getCityImage(city.id);

  return (
    <div className="city-details" style={{ borderColor: factionColor }}>
      {/* 城市背景图 */}
      {cityImage && (
        <div
          className="city-background"
          style={{ backgroundImage: `url(${cityImage})` }}
        />
      )}

      {/* 城市名称和规模 */}
      <div className="city-header">
        <h3 className="city-name">{city.name}</h3>
        <span className="city-scale">{getScaleText(city.scale)}</span>
        {!isPlayerCity && <span className="enemy-badge">敌方</span>}
      </div>

      {/* 城市资源 */}
      <div className="city-resources">
        <div className="resource-row">
          <div className="resource-cell">
            <ResourceIcon src={RESOURCE_ICONS.population} alt="人口" />
            <span className="resource-label">人口</span>
            <span className="resource-value">{formatNumber(resources.population)}</span>
          </div>
          <div className="resource-cell">
            <ResourceIcon src={RESOURCE_ICONS.defense} alt="防御" />
            <span className="resource-label">防御</span>
            <span className="resource-value">{resources.defense}</span>
          </div>
        </div>
        <div className="resource-row">
          <div className="resource-cell">
            <ResourceIcon src={RESOURCE_ICONS.commerce} alt="商业" />
            <span className="resource-label">商业</span>
            <span className="resource-value">{resources.commerce}</span>
          </div>
          <div className="resource-cell">
            <ResourceIcon src={RESOURCE_ICONS.agriculture} alt="农业" />
            <span className="resource-label">农业</span>
            <span className="resource-value">{resources.agriculture}</span>
          </div>
        </div>
        {isPlayerCity && (
          <div className="resource-row">
            <div className="resource-cell">
              <ResourceIcon src={RESOURCE_ICONS.gold} alt="金钱" />
              <span className="resource-label">金钱</span>
              <span className="resource-value">{formatNumber(resources.gold)}</span>
            </div>
            <div className="resource-cell">
              <ResourceIcon src={RESOURCE_ICONS.grain} alt="粮草" />
              <span className="resource-label">粮草</span>
              <span className="resource-value">{formatNumber(resources.grain)}</span>
            </div>
          </div>
        )}
        <div className="resource-row">
          <div className="resource-cell full-width">
            <ResourceIcon src={RESOURCE_ICONS.loyalty} alt="民忠" />
            <span className="resource-label">民忠</span>
            <div className="loyalty-bar">
              <div
                className="loyalty-fill"
                style={{ width: `${resources.loyalty}%` }}
              />
              <span className="loyalty-text">{resources.loyalty}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 驻守武将 */}
      <div className="stationed-generals">
        <h4 className="section-title">
          <ResourceIcon src={RESOURCE_ICONS.troops} alt="武将" />
          驻守武将 ({stationedGenerals.length})
        </h4>
        {stationedGenerals.length > 0 ? (
          <ul className="general-list">
            {stationedGenerals.map((general) => {
              const portrait = getGeneralPortrait(general.id);
              return (
                <li key={general.id} className="general-item">
                  {portrait ? (
                    <img
                      src={portrait}
                      alt={general.name}
                      className="general-portrait"
                    />
                  ) : (
                    <div className="general-portrait-placeholder" />
                  )}
                  <div className="general-info">
                    <span className="general-name">{general.name}</span>
                    <span className="general-troops">
                      <ResourceIcon src={RESOURCE_ICONS.sword} alt="兵力" />
                      {formatNumber(general.troops)}
                    </span>
                    {isPlayerCity && (
                      <span className="general-stats">
                        统{general.attributes.lead} 武{general.attributes.war}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="no-generals">无驻守武将</p>
        )}
      </div>
    </div>
  );
}

export default CityDetails;
