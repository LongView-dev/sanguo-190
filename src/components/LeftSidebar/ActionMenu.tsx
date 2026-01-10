/**
 * 指令菜单组件
 * 根据选中城市类型动态显示菜单项，实现行动力消耗显示
 * @module components/LeftSidebar/ActionMenu
 */

import {
  AP_COST_DOMESTIC,
  AP_COST_CAMPAIGN,
} from '../../types/gameState';

/**
 * 菜单项类型
 */
export type ActionType =
  | 'develop_commerce'
  | 'develop_agriculture'
  | 'recruit'
  | 'search_talent'
  | 'campaign'
  | 'stratagem'
  | 'view_details';

/**
 * 菜单项接口
 */
export interface ActionMenuItem {
  /** 动作ID */
  id: ActionType;
  /** 显示标签 */
  label: string;
  /** 是否可用 */
  enabled: boolean;
  /** 行动力消耗 */
  apCost: number;
  /** 图标 */
  icon: string;
}

/**
 * 指令菜单组件属性
 */
export interface ActionMenuProps {
  /** 是否为玩家城市 */
  isPlayerCity: boolean;
  /** 当前行动力 */
  currentAP: number;
  /** 是否有选中城市 */
  hasSelectedCity: boolean;
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
 * 获取玩家城市菜单项
 * Requirements 1.4: 玩家城市显示 [内政开发], [征兵], [人才探索], [出征]
 */
export function getPlayerCityMenuItems(currentAP: number): ActionMenuItem[] {
  return [
    {
      id: 'develop_commerce',
      label: '开发商业',
      enabled: currentAP >= AP_COST_DOMESTIC,
      apCost: AP_COST_DOMESTIC,
      icon: '🏪',
    },
    {
      id: 'develop_agriculture',
      label: '开发农业',
      enabled: currentAP >= AP_COST_DOMESTIC,
      apCost: AP_COST_DOMESTIC,
      icon: '🌾',
    },
    {
      id: 'recruit',
      label: '征兵',
      enabled: currentAP >= AP_COST_DOMESTIC,
      apCost: AP_COST_DOMESTIC,
      icon: '⚔️',
    },
    {
      id: 'search_talent',
      label: '人才探索',
      enabled: currentAP >= AP_COST_DOMESTIC,
      apCost: AP_COST_DOMESTIC,
      icon: '🔍',
    },
    {
      id: 'campaign',
      label: '出征',
      enabled: currentAP >= AP_COST_CAMPAIGN,
      apCost: AP_COST_CAMPAIGN,
      icon: '🏹',
    },
  ];
}

/**
 * 获取敌方城市菜单项
 * Requirements 1.5: 敌方城市显示 [计略], [查看详情]
 */
export function getEnemyCityMenuItems(): ActionMenuItem[] {
  return [
    {
      id: 'stratagem',
      label: '计略',
      enabled: true,
      apCost: 0,
      icon: '🎭',
    },
    {
      id: 'view_details',
      label: '查看详情',
      enabled: true,
      apCost: 0,
      icon: '👁️',
    },
  ];
}

/**
 * 根据城市所有权获取菜单项
 * Property 18: 城市选择菜单条件
 */
export function getMenuItemsForCity(
  isPlayerCity: boolean,
  currentAP: number
): ActionMenuItem[] {
  if (isPlayerCity) {
    return getPlayerCityMenuItems(currentAP);
  }
  return getEnemyCityMenuItems();
}

/**
 * 指令菜单组件
 * 显示可执行的指令列表
 */
export function ActionMenu({
  isPlayerCity,
  currentAP,
  hasSelectedCity,
  onActionSelect,
  onEndTurn,
  onSave,
  onLoad,
}: ActionMenuProps) {
  const menuItems = hasSelectedCity
    ? getMenuItemsForCity(isPlayerCity, currentAP)
    : [];

  return (
    <div className="action-menu">
      {/* 行动力显示 */}
      <div className="ap-display">
        <span className="ap-label">行动力</span>
        <div className="ap-dots">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`ap-dot ${i < currentAP ? 'active' : ''}`}
            />
          ))}
        </div>
        <span className="ap-value">{currentAP}/3</span>
      </div>

      {/* 指令列表 */}
      {hasSelectedCity ? (
        <div className="menu-items">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-item ${!item.enabled ? 'disabled' : ''}`}
              disabled={!item.enabled}
              onClick={() => onActionSelect(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
              {item.apCost > 0 && (
                <span className="menu-ap-cost">-{item.apCost} AP</span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="no-selection">
          <p>请选择一个城市</p>
        </div>
      )}

      {/* 结束回合按钮 - Requirements 1.6 */}
      <button className="end-turn-button" onClick={onEndTurn}>
        结束回合 / 下个月
      </button>

      {/* 存档/读档按钮 - Requirements 11.5, 11.9 */}
      <div className="saveload-buttons">
        {onSave && (
          <button className="saveload-button save" onClick={onSave}>
            💾 保存
          </button>
        )}
        {onLoad && (
          <button className="saveload-button load" onClick={onLoad}>
            📂 读档
          </button>
        )}
      </div>
    </div>
  );
}

export default ActionMenu;
