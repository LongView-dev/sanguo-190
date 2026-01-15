/**
 * 武将选择器组件
 * 通用武将选择UI，支持单选/多选模式
 * @module components/GeneralSelector
 */

import { useState, useMemo } from 'react';
import type { General } from '../../types/general';
import './GeneralSelector.css';

/**
 * 排序方式
 */
export type SortBy = 'pol' | 'lead' | 'war' | 'int' | 'cha' | 'troops';

/**
 * 武将选择器属性
 */
export interface GeneralSelectorProps {
    /** 可选武将列表 */
    generals: General[];
    /** 选中的武将ID列表 */
    selectedIds: string[];
    /** 选择变更回调 */
    onSelectionChange: (ids: string[]) => void;
    /** 是否多选模式 */
    multiSelect?: boolean;
    /** 推荐排序属性 */
    recommendedSort?: SortBy;
    /** 最大选择数量（多选模式） */
    maxSelection?: number;
    /** 是否禁用 */
    disabled?: boolean;
}

/**
 * 排序标签映射
 */
const SORT_LABELS: Record<SortBy, string> = {
    pol: '政治',
    lead: '统帅',
    war: '武力',
    int: '智力',
    cha: '魅力',
    troops: '兵力',
};

/**
 * 获取武将排序值
 */
function getSortValue(general: General, sortBy: SortBy): number {
    switch (sortBy) {
        case 'troops':
            return general.troops;
        default:
            return general.attributes[sortBy];
    }
}

/**
 * 武将选择器组件
 */
export function GeneralSelector({
    generals,
    selectedIds,
    onSelectionChange,
    multiSelect = false,
    recommendedSort = 'pol',
    maxSelection = 5,
    disabled = false,
}: GeneralSelectorProps) {
    const [sortBy, setSortBy] = useState<SortBy>(recommendedSort);

    // 按属性排序的武将列表
    const sortedGenerals = useMemo(() => {
        return [...generals].sort((a, b) => getSortValue(b, sortBy) - getSortValue(a, sortBy));
    }, [generals, sortBy]);

    // 处理武将选择
    const handleSelect = (generalId: string) => {
        if (disabled) return;

        if (multiSelect) {
            if (selectedIds.includes(generalId)) {
                // 取消选择
                onSelectionChange(selectedIds.filter(id => id !== generalId));
            } else if (selectedIds.length < maxSelection) {
                // 添加选择
                onSelectionChange([...selectedIds, generalId]);
            }
        } else {
            // 单选模式
            onSelectionChange([generalId]);
        }
    };

    // 检查是否已达最大选择数
    const isMaxReached = multiSelect && selectedIds.length >= maxSelection;

    return (
        <div className={`general-selector ${disabled ? 'disabled' : ''}`}>
            {/* 排序选项 */}
            <div className="sort-options">
                <span className="sort-label">排序:</span>
                {(Object.keys(SORT_LABELS) as SortBy[]).map(key => (
                    <button
                        key={key}
                        className={`sort-btn ${sortBy === key ? 'active' : ''}`}
                        onClick={() => setSortBy(key)}
                        disabled={disabled}
                    >
                        {SORT_LABELS[key]}
                    </button>
                ))}
            </div>

            {/* 武将列表 */}
            <div className="generals-list">
                {sortedGenerals.length === 0 ? (
                    <div className="no-generals">没有可选武将</div>
                ) : (
                    sortedGenerals.map(general => {
                        const isSelected = selectedIds.includes(general.id);
                        const isDisabled = disabled || (isMaxReached && !isSelected);

                        return (
                            <div
                                key={general.id}
                                className={`general-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                onClick={() => !isDisabled && handleSelect(general.id)}
                            >
                                <div className="general-name">{general.name}</div>
                                <div className="general-stats">
                                    <span className="stat" title="统帅">
                                        <span className="stat-icon">🎖️</span>
                                        {general.attributes.lead}
                                    </span>
                                    <span className="stat" title="武力">
                                        <span className="stat-icon">⚔️</span>
                                        {general.attributes.war}
                                    </span>
                                    <span className="stat" title="智力">
                                        <span className="stat-icon">📚</span>
                                        {general.attributes.int}
                                    </span>
                                    <span className="stat" title="政治">
                                        <span className="stat-icon">📜</span>
                                        {general.attributes.pol}
                                    </span>
                                    <span className="stat" title="魅力">
                                        <span className="stat-icon">✨</span>
                                        {general.attributes.cha}
                                    </span>
                                </div>
                                <div className="general-troops">
                                    <span className="troops-icon">🪖</span>
                                    <span className="troops-value">{general.troops.toLocaleString()}</span>
                                </div>
                                {isSelected && <div className="selection-indicator">✓</div>}
                            </div>
                        );
                    })
                )}
            </div>

            {/* 选择计数（多选模式） */}
            {multiSelect && (
                <div className="selection-count">
                    已选择 {selectedIds.length}/{maxSelection} 名武将
                </div>
            )}
        </div>
    );
}

export default GeneralSelector;
