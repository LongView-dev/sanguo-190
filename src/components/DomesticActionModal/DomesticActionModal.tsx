/**
 * 内政执行对话框
 * 处理开发商业/农业、征兵、人才探索等内政指令
 * @module components/DomesticActionModal
 */

import { useState, useMemo, useCallback } from 'react';
import { GeneralSelector } from '../GeneralSelector';
import type { General } from '../../types/general';
import type { City } from '../../types/city';
import {
    executeDevelopment,
    executeRecruitment,
    calculateDevelopmentIncrease,
    calculateRecruitmentSoldiers,
    calculateLoyaltyDecrease,
    DEVELOPMENT_GOLD_COST,
    RECRUITMENT_GOLD_PER_SOLDIER,
    RECRUITMENT_POPULATION_PER_SOLDIER,
} from '../../systems/domestic';
import './DomesticActionModal.css';

/**
 * 内政动作类型
 */
export type DomesticActionType =
    | 'develop_commerce'
    | 'develop_agriculture'
    | 'recruit'
    | 'search_talent';

/**
 * 内政执行结果
 */
export interface DomesticActionResult {
    success: boolean;
    actionType: DomesticActionType;
    generalId: string;
    generalName: string;
    cityId: string;
    value?: number;
    message: string;
}

/**
 * 内政执行对话框属性
 */
export interface DomesticActionModalProps {
    /** 是否显示 */
    isOpen: boolean;
    /** 关闭回调 */
    onClose: () => void;
    /** 执行完成回调 */
    onExecute: (result: DomesticActionResult) => void;
    /** 动作类型 */
    actionType: DomesticActionType;
    /** 当前城市 */
    city: City;
    /** 城市中的武将列表 */
    generals: General[];
}

/**
 * 动作类型标签
 */
const ACTION_LABELS: Record<DomesticActionType, string> = {
    develop_commerce: '开发商业',
    develop_agriculture: '开发农业',
    recruit: '征兵',
    search_talent: '人才探索',
};

/**
 * 动作类型图标
 */
const ACTION_ICONS: Record<DomesticActionType, string> = {
    develop_commerce: '🏪',
    develop_agriculture: '🌾',
    recruit: '⚔️',
    search_talent: '🔍',
};

/**
 * 获取推荐排序属性
 */
function getRecommendedSort(actionType: DomesticActionType): 'pol' | 'lead' | 'cha' | 'int' {
    switch (actionType) {
        case 'develop_commerce':
        case 'develop_agriculture':
            return 'pol';
        case 'recruit':
            return 'lead';
        case 'search_talent':
            return 'int';
    }
}

/**
 * 内政执行对话框组件
 */
export function DomesticActionModal({
    isOpen,
    onClose,
    onExecute,
    actionType,
    city,
    generals,
}: DomesticActionModalProps) {
    const [selectedGeneralIds, setSelectedGeneralIds] = useState<string[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);

    // 选中的武将
    const selectedGeneral = useMemo(() => {
        if (selectedGeneralIds.length === 0) return null;
        return generals.find(g => g.id === selectedGeneralIds[0]) || null;
    }, [selectedGeneralIds, generals]);

    // 预览效果计算
    const preview = useMemo(() => {
        if (!selectedGeneral) return null;

        switch (actionType) {
            case 'develop_commerce':
            case 'develop_agriculture': {
                const minIncrease = calculateDevelopmentIncrease(selectedGeneral.attributes.pol, 1);
                const maxIncrease = calculateDevelopmentIncrease(selectedGeneral.attributes.pol, 5);
                return {
                    goldCost: DEVELOPMENT_GOLD_COST,
                    effectRange: `${minIncrease} ~ ${maxIncrease}`,
                    canExecute: city.resources.gold >= DEVELOPMENT_GOLD_COST,
                    errorMessage: city.resources.gold < DEVELOPMENT_GOLD_COST ? '金钱不足' : null,
                };
            }
            case 'recruit': {
                const soldiers = calculateRecruitmentSoldiers(
                    selectedGeneral.attributes.lead,
                    selectedGeneral.attributes.cha
                );
                const goldCost = soldiers * RECRUITMENT_GOLD_PER_SOLDIER;
                const populationCost = soldiers * RECRUITMENT_POPULATION_PER_SOLDIER;
                const loyaltyDecrease = calculateLoyaltyDecrease(selectedGeneral.attributes.cha);

                const hasEnoughGold = city.resources.gold >= goldCost;
                const hasEnoughPop = city.resources.population >= populationCost;

                return {
                    soldiers,
                    goldCost,
                    populationCost,
                    loyaltyDecrease,
                    canExecute: hasEnoughGold && hasEnoughPop,
                    errorMessage: !hasEnoughGold ? '金钱不足' : !hasEnoughPop ? '人口不足' : null,
                };
            }
            case 'search_talent': {
                // 探索成功率：智力 × 0.5 + 魅力 × 0.3，最高80%
                const successRate = Math.min(
                    80,
                    Math.floor(selectedGeneral.attributes.int * 0.5 + selectedGeneral.attributes.cha * 0.3)
                );
                return {
                    successRate,
                    canExecute: true,
                    errorMessage: null,
                };
            }
        }
    }, [actionType, selectedGeneral, city.resources]);

    // 执行内政动作
    const handleExecute = useCallback(() => {
        if (!selectedGeneral || !preview?.canExecute) return;

        setIsExecuting(true);

        // 模拟执行延迟
        setTimeout(() => {
            let result: DomesticActionResult;

            switch (actionType) {
                case 'develop_commerce':
                case 'develop_agriculture': {
                    const currentValue =
                        actionType === 'develop_commerce'
                            ? city.resources.commerce
                            : city.resources.agriculture;
                    const devResult = executeDevelopment(
                        city.resources.gold,
                        currentValue,
                        selectedGeneral.attributes.pol
                    );

                    result = {
                        success: devResult.success,
                        actionType,
                        generalId: selectedGeneral.id,
                        generalName: selectedGeneral.name,
                        cityId: city.id,
                        value: devResult.valueIncrease,
                        message: devResult.success
                            ? `${selectedGeneral.name}成功开发${actionType === 'develop_commerce' ? '商业' : '农业'}，增加了${devResult.valueIncrease}点`
                            : devResult.error || '执行失败',
                    };
                    break;
                }
                case 'recruit': {
                    const recruitResult = executeRecruitment(
                        city.resources,
                        selectedGeneral.attributes.lead,
                        selectedGeneral.attributes.cha
                    );

                    result = {
                        success: recruitResult.success,
                        actionType,
                        generalId: selectedGeneral.id,
                        generalName: selectedGeneral.name,
                        cityId: city.id,
                        value: recruitResult.soldiersGained,
                        message: recruitResult.success
                            ? `${selectedGeneral.name}成功征募${recruitResult.soldiersGained.toLocaleString()}名士兵`
                            : recruitResult.error || '执行失败',
                    };
                    break;
                }
                case 'search_talent': {
                    // 人才探索：根据成功率判定
                    const roll = Math.random() * 100;
                    const successRate =
                        selectedGeneral.attributes.int * 0.5 + selectedGeneral.attributes.cha * 0.3;
                    const success = roll < successRate;

                    result = {
                        success,
                        actionType,
                        generalId: selectedGeneral.id,
                        generalName: selectedGeneral.name,
                        cityId: city.id,
                        message: success
                            ? `${selectedGeneral.name}探索成功，发现了隐藏的人才！`
                            : `${selectedGeneral.name}四处探访，但未能发现合适的人才。`,
                    };
                    break;
                }
            }

            setIsExecuting(false);
            onExecute(result);
        }, 500);
    }, [actionType, selectedGeneral, preview, city, onExecute]);

    // 关闭时重置状态
    const handleClose = useCallback(() => {
        setSelectedGeneralIds([]);
        onClose();
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="domestic-modal-overlay" onClick={handleClose}>
            <div className="domestic-modal" onClick={e => e.stopPropagation()}>
                {/* 标题 */}
                <div className="domestic-modal-header">
                    <span className="action-icon">{ACTION_ICONS[actionType]}</span>
                    <h2>{ACTION_LABELS[actionType]}</h2>
                    <span className="city-name">- {city.name}</span>
                    <button className="close-btn" onClick={handleClose}>
                        ✕
                    </button>
                </div>

                {/* 内容区 */}
                <div className="domestic-modal-content">
                    {/* 武将选择 */}
                    <div className="section">
                        <h3>选择执行武将</h3>
                        <GeneralSelector
                            generals={generals}
                            selectedIds={selectedGeneralIds}
                            onSelectionChange={setSelectedGeneralIds}
                            multiSelect={false}
                            recommendedSort={getRecommendedSort(actionType)}
                            disabled={isExecuting}
                        />
                    </div>

                    {/* 效果预览 */}
                    {preview && selectedGeneral && (
                        <div className="section preview-section">
                            <h3>效果预览</h3>
                            <div className="preview-content">
                                {(actionType === 'develop_commerce' || actionType === 'develop_agriculture') && (
                                    <>
                                        <div className="preview-row">
                                            <span className="label">消耗金钱:</span>
                                            <span className="value cost">-{preview.goldCost}</span>
                                        </div>
                                        <div className="preview-row">
                                            <span className="label">预计增长:</span>
                                            <span className="value gain">+{preview.effectRange}</span>
                                        </div>
                                    </>
                                )}

                                {actionType === 'recruit' && 'soldiers' in preview && (
                                    <>
                                        <div className="preview-row">
                                            <span className="label">预计征兵:</span>
                                            <span className="value gain">+{preview.soldiers?.toLocaleString()}</span>
                                        </div>
                                        <div className="preview-row">
                                            <span className="label">消耗金钱:</span>
                                            <span className="value cost">-{preview.goldCost?.toLocaleString()}</span>
                                        </div>
                                        <div className="preview-row">
                                            <span className="label">消耗人口:</span>
                                            <span className="value cost">-{preview.populationCost?.toLocaleString()}</span>
                                        </div>
                                        <div className="preview-row">
                                            <span className="label">民忠下降:</span>
                                            <span className="value cost">-{preview.loyaltyDecrease}</span>
                                        </div>
                                    </>
                                )}

                                {actionType === 'search_talent' && 'successRate' in preview && (
                                    <div className="preview-row">
                                        <span className="label">成功率:</span>
                                        <span className="value">{preview.successRate}%</span>
                                    </div>
                                )}

                                {preview.errorMessage && (
                                    <div className="error-message">{preview.errorMessage}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 底部按钮 */}
                <div className="domestic-modal-footer">
                    <button className="cancel-btn" onClick={handleClose} disabled={isExecuting}>
                        取消
                    </button>
                    <button
                        className="execute-btn"
                        onClick={handleExecute}
                        disabled={!selectedGeneral || !preview?.canExecute || isExecuting}
                    >
                        {isExecuting ? '执行中...' : '确认执行'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DomesticActionModal;
