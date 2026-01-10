/**
 * 军师对话组件
 * 显示军师建议的对话框
 * @module components/AdvisorDialog
 */

import { useState, useCallback } from 'react';
import type { City, General, Faction } from '../../types';
import {
  AdvisorService,
  createAdvisorServiceForFaction,
  type AdvisorResponse,
} from '../../services/llm';
import './AdvisorDialog.css';

/**
 * 军师对话组件属性
 */
export interface AdvisorDialogProps {
  /** 是否显示对话框 */
  isOpen: boolean;
  /** 关闭对话框回调 */
  onClose: () => void;
  /** 当前城市 */
  currentCity: City | null;
  /** 所有城市 */
  allCities: Record<string, City>;
  /** 所有势力 */
  factions: Record<string, Faction>;
  /** 所有武将 */
  generals: Record<string, General>;
  /** 玩家势力ID */
  playerFactionId: string;
  /** 当前日期 */
  currentDate: { year: number; month: number };
}

/**
 * 军师对话组件
 */
export function AdvisorDialog({
  isOpen,
  onClose,
  currentCity,
  allCities,
  factions,
  generals,
  playerFactionId,
  currentDate,
}: AdvisorDialogProps) {
  const [advice, setAdvice] = useState<AdvisorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [advisorService] = useState<AdvisorService>(() =>
    createAdvisorServiceForFaction(playerFactionId)
  );

  const currentAdvisor = advisorService.getCurrentAdvisor();

  /**
   * 请求军师建议
   */
  const requestAdvice = useCallback(async () => {
    if (!currentCity) return;

    setIsLoading(true);
    try {
      const response = await advisorService.getAdvice(
        currentCity,
        allCities,
        factions,
        generals,
        playerFactionId,
        currentDate
      );
      setAdvice(response);
    } catch (error) {
      console.error('获取军师建议失败:', error);
      setAdvice({
        advice: '军师暂时无法提供建议，请稍后再试。',
        advisorName: currentAdvisor.name,
        isFallback: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    currentCity,
    allCities,
    factions,
    generals,
    playerFactionId,
    currentDate,
    advisorService,
    currentAdvisor.name,
  ]);

  /**
   * 切换军师
   */
  const switchAdvisor = useCallback(
    (advisorId: string) => {
      advisorService.setAdvisor(advisorId);
      setAdvice(null);
    },
    [advisorService]
  );

  if (!isOpen) return null;

  const availableAdvisors = advisorService.getAvailableAdvisors();

  return (
    <div className="advisor-dialog-overlay" onClick={onClose}>
      <div className="advisor-dialog" onClick={(e) => e.stopPropagation()}>
        {/* 对话框头部 */}
        <div className="advisor-dialog-header">
          <h3>军师建议</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* 军师选择 */}
        <div className="advisor-selector">
          <label>选择军师：</label>
          <select
            value={currentAdvisor.id}
            onChange={(e) => switchAdvisor(e.target.value)}
          >
            {availableAdvisors.map((advisor) => (
              <option key={advisor.id} value={advisor.id}>
                {advisor.name}
              </option>
            ))}
          </select>
        </div>

        {/* 军师信息 */}
        <div className="advisor-info">
          <div className="advisor-name">{currentAdvisor.name}</div>
          <div className="advisor-description">{currentAdvisor.description}</div>
        </div>

        {/* 建议内容 */}
        <div className="advice-content">
          {isLoading ? (
            <div className="loading">军师正在思考...</div>
          ) : advice ? (
            <div className="advice-text">
              <span className="advisor-quote">"</span>
              {advice.advice}
              <span className="advisor-quote">"</span>
              {advice.isFallback && (
                <div className="fallback-notice">（离线建议）</div>
              )}
            </div>
          ) : (
            <div className="no-advice">点击下方按钮获取军师建议</div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="advisor-dialog-actions">
          <button
            className="request-advice-button"
            onClick={requestAdvice}
            disabled={isLoading || !currentCity}
          >
            {isLoading ? '思考中...' : '请教军师'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdvisorDialog;
