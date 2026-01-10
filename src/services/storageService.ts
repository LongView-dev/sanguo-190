/**
 * 浏览器存储服务
 * 实现 LocalStorage 自动保存和 IndexedDB 手动存档槽位
 *
 * Requirements: 11.6, 11.7, 11.8, 11.9
 */

import type { GameState } from '../types';
import {
  serializeGameState,
  deserializeGameState,
  saveToString,
  loadFromString,
  type SerializedSave,
} from './saveLoad';

/**
 * 存档槽位信息
 */
export interface SaveSlotInfo {
  /** 槽位ID (0-9) */
  slotId: number;
  /** 存档名称 */
  name: string;
  /** 势力名称 */
  faction: string;
  /** 游戏日期 */
  date: { year: number; month: number };
  /** 保存时间 */
  savedAt: Date;
}

/**
 * LocalStorage 键名
 */
const AUTO_SAVE_KEY = 'sanguo190_autosave';

/**
 * IndexedDB 配置
 */
const DB_NAME = 'sanguo190_saves';
const DB_VERSION = 1;
const STORE_NAME = 'save_slots';

/**
 * 最大存档槽位数
 */
export const MAX_SAVE_SLOTS = 10;

/**
 * 打开 IndexedDB 数据库
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('无法打开存档数据库'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'slotId' });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };
  });
}


/**
 * 存储服务接口实现
 */
export const storageService = {
  /**
   * 自动保存游戏状态到 LocalStorage
   * 每回合结束时调用
   *
   * Requirements: 11.6
   */
  autoSave(state: GameState): void {
    try {
      const serialized = serializeGameState(state);
      const saveString = saveToString(serialized);
      localStorage.setItem(AUTO_SAVE_KEY, saveString);
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  },

  /**
   * 从 LocalStorage 加载自动保存
   *
   * Requirements: 11.8
   */
  loadAutoSave(): GameState | null {
    try {
      const saveString = localStorage.getItem(AUTO_SAVE_KEY);
      if (!saveString) {
        return null;
      }
      const serialized = loadFromString(saveString);
      return deserializeGameState(serialized);
    } catch (error) {
      console.error('加载自动保存失败:', error);
      return null;
    }
  },

  /**
   * 检查是否存在自动保存
   *
   * Requirements: 11.8
   */
  hasAutoSave(): boolean {
    return localStorage.getItem(AUTO_SAVE_KEY) !== null;
  },

  /**
   * 清除自动保存
   */
  clearAutoSave(): void {
    localStorage.removeItem(AUTO_SAVE_KEY);
  },

  /**
   * 手动保存到 IndexedDB 槽位
   *
   * Requirements: 11.7
   */
  async saveToSlot(slotId: number, state: GameState, name: string): Promise<void> {
    if (slotId < 0 || slotId >= MAX_SAVE_SLOTS) {
      throw new Error(`无效的存档槽位: ${slotId}`);
    }

    const db = await openDatabase();
    const serialized = serializeGameState(state);

    // 获取势力名称
    const factionId = state.currentFaction;
    const faction = state.factions[factionId];
    const factionName = faction?.name || '未知势力';

    const saveRecord = {
      slotId,
      name,
      faction: factionName,
      date: { ...state.currentDate },
      savedAt: new Date().toISOString(),
      data: saveToString(serialized),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(saveRecord);

      request.onerror = () => {
        reject(new Error('保存到槽位失败'));
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  },

  /**
   * 从 IndexedDB 槽位加载存档
   *
   * Requirements: 11.7
   */
  async loadFromSlot(slotId: number): Promise<GameState | null> {
    if (slotId < 0 || slotId >= MAX_SAVE_SLOTS) {
      throw new Error(`无效的存档槽位: ${slotId}`);
    }

    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(slotId);

      request.onerror = () => {
        reject(new Error('加载存档失败'));
      };

      request.onsuccess = () => {
        const record = request.result;
        if (!record) {
          resolve(null);
          return;
        }

        try {
          const serialized = loadFromString(record.data);
          const state = deserializeGameState(serialized);
          resolve(state);
        } catch (error) {
          console.error('解析存档数据失败:', error);
          resolve(null);
        }
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  },


  /**
   * 获取所有存档槽位信息
   *
   * Requirements: 11.9
   */
  async listSaveSlots(): Promise<SaveSlotInfo[]> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => {
        reject(new Error('获取存档列表失败'));
      };

      request.onsuccess = () => {
        const records = request.result || [];
        const slots: SaveSlotInfo[] = records.map(
          (record: {
            slotId: number;
            name: string;
            faction: string;
            date: { year: number; month: number };
            savedAt: string;
          }) => ({
            slotId: record.slotId,
            name: record.name,
            faction: record.faction,
            date: record.date,
            savedAt: new Date(record.savedAt),
          })
        );

        // 按槽位ID排序
        slots.sort((a, b) => a.slotId - b.slotId);
        resolve(slots);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  },

  /**
   * 删除指定槽位的存档
   */
  async deleteSlot(slotId: number): Promise<void> {
    if (slotId < 0 || slotId >= MAX_SAVE_SLOTS) {
      throw new Error(`无效的存档槽位: ${slotId}`);
    }

    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(slotId);

      request.onerror = () => {
        reject(new Error('删除存档失败'));
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  },

  /**
   * 获取自动保存的元信息（用于显示恢复提示）
   *
   * Requirements: 11.8
   */
  getAutoSaveInfo(): SaveSlotInfo | null {
    try {
      const saveString = localStorage.getItem(AUTO_SAVE_KEY);
      if (!saveString) {
        return null;
      }

      const serialized: SerializedSave = JSON.parse(saveString);
      const state = deserializeGameState(serialized);

      const factionId = state.currentFaction;
      const faction = state.factions[factionId];

      return {
        slotId: -1, // 自动保存使用 -1 作为特殊标识
        name: '自动保存',
        faction: faction?.name || '未知势力',
        date: state.currentDate,
        savedAt: new Date(serialized.savedAt),
      };
    } catch {
      return null;
    }
  },
};

/**
 * 导出存储服务类型
 */
export type StorageService = typeof storageService;
