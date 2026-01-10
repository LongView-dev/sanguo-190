/**
 * 存档/读档界面组件
 * 显示存档槽位列表，支持存档预览、保存、加载和删除操作
 * 
 * Requirements: 11.5, 11.9
 * @module components/SaveLoadModal
 */

import { useState, useEffect, useCallback } from 'react';
import type { GameState } from '../../types';
import { storageService, type SaveSlotInfo, MAX_SAVE_SLOTS } from '../../services/storageService';
import { formatGameStatePreview } from '../../services/saveLoad';
import './SaveLoadModal.css';

/**
 * 存档/读档模态框属性
 */
export interface SaveLoadModalProps {
  /** 是否显示模态框 */
  isOpen: boolean;
  /** 关闭模态框回调 */
  onClose: () => void;
  /** 当前游戏状态（用于保存） */
  currentState: GameState;
  /** 加载存档回调 */
  onLoad: (state: GameState) => void;
  /** 模式：save-保存，load-加载 */
  mode: 'save' | 'load';
}

/**
 * 格式化日期显示
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 存档/读档模态框组件
 */
export function SaveLoadModal({
  isOpen,
  onClose,
  currentState,
  onLoad,
  mode,
}: SaveLoadModalProps) {
  const [slots, setSlots] = useState<(SaveSlotInfo | null)[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [previewJson, setPreviewJson] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  /**
   * 加载存档槽位列表
   */
  const loadSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const savedSlots = await storageService.listSaveSlots();
      // 创建完整的槽位数组（0-9）
      const fullSlots: (SaveSlotInfo | null)[] = Array(MAX_SAVE_SLOTS).fill(null);
      savedSlots.forEach((slot) => {
        if (slot.slotId >= 0 && slot.slotId < MAX_SAVE_SLOTS) {
          fullSlots[slot.slotId] = slot;
        }
      });
      setSlots(fullSlots);
    } catch (err) {
      setError('加载存档列表失败');
      console.error('加载存档列表失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 初始化加载存档列表
   */
  useEffect(() => {
    if (isOpen) {
      loadSlots();
      setSelectedSlot(null);
      setPreviewJson('');
      setSaveName('');
      setError(null);
      setShowConfirmDelete(false);
    }
  }, [isOpen, loadSlots]);

  /**
   * 选择槽位
   */
  const handleSelectSlot = useCallback(async (slotId: number) => {
    setSelectedSlot(slotId);
    setShowConfirmDelete(false);
    setError(null);

    const slot = slots[slotId];
    if (slot) {
      // 加载存档数据用于预览
      setIsLoading(true);
      try {
        const state = await storageService.loadFromSlot(slotId);
        if (state) {
          setPreviewJson(formatGameStatePreview(state));
        } else {
          setPreviewJson('');
        }
      } catch (err) {
        setPreviewJson('无法加载存档预览');
        console.error('加载存档预览失败:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setPreviewJson('');
    }
  }, [slots]);

  /**
   * 保存到槽位
   */
  const handleSave = useCallback(async () => {
    if (selectedSlot === null) return;

    const name = saveName.trim() || `存档 ${selectedSlot + 1}`;
    setIsLoading(true);
    setError(null);

    try {
      await storageService.saveToSlot(selectedSlot, currentState, name);
      await loadSlots();
      setSelectedSlot(null);
      setSaveName('');
      // 显示成功提示后关闭
      setTimeout(() => onClose(), 500);
    } catch (err) {
      setError('保存失败，请重试');
      console.error('保存失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSlot, saveName, currentState, loadSlots, onClose]);

  /**
   * 从槽位加载
   */
  const handleLoad = useCallback(async () => {
    if (selectedSlot === null) return;

    setIsLoading(true);
    setError(null);

    try {
      const state = await storageService.loadFromSlot(selectedSlot);
      if (state) {
        onLoad(state);
        onClose();
      } else {
        setError('存档数据无效');
      }
    } catch (err) {
      setError('加载失败，存档可能已损坏');
      console.error('加载失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSlot, onLoad, onClose]);

  /**
   * 删除槽位
   */
  const handleDelete = useCallback(async () => {
    if (selectedSlot === null) return;

    setIsLoading(true);
    setError(null);

    try {
      await storageService.deleteSlot(selectedSlot);
      await loadSlots();
      setSelectedSlot(null);
      setPreviewJson('');
      setShowConfirmDelete(false);
    } catch (err) {
      setError('删除失败，请重试');
      console.error('删除失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSlot, loadSlots]);

  if (!isOpen) return null;

  const selectedSlotInfo = selectedSlot !== null ? slots[selectedSlot] : null;
  const canSave = selectedSlot !== null;
  const canLoad = selectedSlot !== null && selectedSlotInfo !== null;
  const canDelete = selectedSlot !== null && selectedSlotInfo !== null;

  return (
    <div className="saveload-modal-overlay" onClick={onClose}>
      <div className="saveload-modal" onClick={(e) => e.stopPropagation()}>
        {/* 模态框头部 */}
        <div className="saveload-modal-header">
          <h3>{mode === 'save' ? '保存游戏' : '加载游戏'}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* 错误提示 */}
        {error && <div className="saveload-error">{error}</div>}

        {/* 主体内容 */}
        <div className="saveload-modal-body">
          {/* 左侧：槽位列表 */}
          <div className="saveload-slots">
            <div className="slots-header">存档槽位</div>
            <div className="slots-list">
              {slots.map((slot, index) => (
                <div
                  key={index}
                  className={`slot-item ${selectedSlot === index ? 'selected' : ''} ${slot ? 'has-save' : 'empty'}`}
                  onClick={() => handleSelectSlot(index)}
                >
                  <div className="slot-number">槽位 {index + 1}</div>
                  {slot ? (
                    <div className="slot-info">
                      <div className="slot-name">{slot.name}</div>
                      <div className="slot-details">
                        <span className="slot-faction">{slot.faction}</span>
                        <span className="slot-date">
                          {slot.date.year}年{slot.date.month}月
                        </span>
                      </div>
                      <div className="slot-saved-at">
                        {formatDate(slot.savedAt)}
                      </div>
                    </div>
                  ) : (
                    <div className="slot-empty">空槽位</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 右侧：预览和操作 */}
          <div className="saveload-preview">
            <div className="preview-header">
              {mode === 'save' && selectedSlot !== null && (
                <div className="save-name-input">
                  <label>存档名称：</label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder={`存档 ${selectedSlot + 1}`}
                    maxLength={20}
                  />
                </div>
              )}
              {selectedSlotInfo && (
                <div className="preview-title">存档预览 (JSON)</div>
              )}
            </div>
            <div className="preview-content">
              {isLoading ? (
                <div className="preview-loading">加载中...</div>
              ) : previewJson ? (
                <pre className="preview-json">{previewJson}</pre>
              ) : selectedSlot !== null ? (
                <div className="preview-empty">
                  {mode === 'save' 
                    ? '选择槽位后可保存当前游戏进度' 
                    : '此槽位为空'}
                </div>
              ) : (
                <div className="preview-empty">请选择一个存档槽位</div>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="saveload-modal-footer">
          {showConfirmDelete ? (
            <div className="delete-confirm">
              <span>确定要删除此存档吗？</span>
              <button
                className="confirm-delete-button"
                onClick={handleDelete}
                disabled={isLoading}
              >
                确认删除
              </button>
              <button
                className="cancel-delete-button"
                onClick={() => setShowConfirmDelete(false)}
              >
                取消
              </button>
            </div>
          ) : (
            <>
              {mode === 'save' ? (
                <button
                  className="action-button save-button"
                  onClick={handleSave}
                  disabled={!canSave || isLoading}
                >
                  {isLoading ? '保存中...' : '保存'}
                </button>
              ) : (
                <button
                  className="action-button load-button"
                  onClick={handleLoad}
                  disabled={!canLoad || isLoading}
                >
                  {isLoading ? '加载中...' : '加载'}
                </button>
              )}
              <button
                className="action-button delete-button"
                onClick={() => setShowConfirmDelete(true)}
                disabled={!canDelete || isLoading}
              >
                删除
              </button>
              <button className="action-button cancel-button" onClick={onClose}>
                取消
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SaveLoadModal;
