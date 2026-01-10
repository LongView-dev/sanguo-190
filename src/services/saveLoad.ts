/**
 * 存档序列化/反序列化服务
 * 实现游戏状态的保存和加载功能
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.10
 */

import LZString from 'lz-string';
import type { GameState } from '../types';

/**
 * 存档版本号 - 用于兼容性检查
 */
export const SAVE_VERSION = '1.0.0';

/**
 * 序列化后的存档数据结构
 */
export interface SerializedSave {
  /** 存档版本号 */
  version: string;
  /** 数据完整性校验和 */
  checksum: string;
  /** 压缩后的游戏状态数据 */
  data: string;
  /** 保存时间戳 */
  savedAt: number;
}

/**
 * 数据完整性校验错误
 */
export class SaveDataIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaveDataIntegrityError';
  }
}

/**
 * 存档版本不兼容错误
 */
export class SaveVersionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaveVersionError';
  }
}

/**
 * 计算数据校验和
 * 使用简单的哈希算法生成校验和
 */
export function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}


/**
 * 验证游戏状态数据完整性
 * 检查所有必要字段是否存在且有效
 *
 * Requirements: 11.4
 */
export function validateGameState(state: unknown): state is GameState {
  if (!state || typeof state !== 'object') {
    return false;
  }

  const s = state as Record<string, unknown>;

  // 验证基本字段存在
  if (
    !s.currentDate ||
    typeof s.currentFaction !== 'string' ||
    typeof s.actionPoints !== 'number' ||
    typeof s.phase !== 'string' ||
    !s.factions ||
    !s.cities ||
    !s.generals ||
    !Array.isArray(s.eventLog)
  ) {
    return false;
  }

  // 验证日期格式
  const date = s.currentDate as Record<string, unknown>;
  if (typeof date.year !== 'number' || typeof date.month !== 'number') {
    return false;
  }

  // 验证月份范围
  if (date.month < 1 || date.month > 12) {
    return false;
  }

  // 验证游戏阶段
  if (!['player', 'calculation', 'narrative'].includes(s.phase as string)) {
    return false;
  }

  // 验证势力数据
  if (typeof s.factions !== 'object' || s.factions === null) {
    return false;
  }

  // 验证城市数据
  if (typeof s.cities !== 'object' || s.cities === null) {
    return false;
  }

  // 验证武将数据
  if (typeof s.generals !== 'object' || s.generals === null) {
    return false;
  }

  return true;
}

/**
 * 序列化游戏状态为JSON字符串并压缩
 *
 * Requirements: 11.1, 11.3, 11.10
 *
 * @param state 游戏状态
 * @returns 序列化后的存档数据
 */
export function serializeGameState(state: GameState): SerializedSave {
  // 将游戏状态转换为JSON字符串
  const jsonString = JSON.stringify(state);

  // 使用LZ-String压缩数据
  const compressedData = LZString.compressToUTF16(jsonString);

  // 计算校验和（基于原始JSON）
  const checksum = calculateChecksum(jsonString);

  return {
    version: SAVE_VERSION,
    checksum,
    data: compressedData,
    savedAt: Date.now(),
  };
}

/**
 * 反序列化存档数据为游戏状态
 *
 * Requirements: 11.2, 11.4, 11.10
 *
 * @param save 序列化的存档数据
 * @returns 游戏状态
 * @throws SaveVersionError 版本不兼容时抛出
 * @throws SaveDataIntegrityError 数据校验失败时抛出
 */
export function deserializeGameState(save: SerializedSave): GameState {
  // 版本检查
  if (save.version !== SAVE_VERSION) {
    throw new SaveVersionError(
      `存档版本不兼容: 期望 ${SAVE_VERSION}, 实际 ${save.version}`
    );
  }

  // 解压数据
  const jsonString = LZString.decompressFromUTF16(save.data);

  if (!jsonString) {
    throw new SaveDataIntegrityError('存档数据解压失败');
  }

  // 校验数据完整性
  const calculatedChecksum = calculateChecksum(jsonString);
  if (calculatedChecksum !== save.checksum) {
    throw new SaveDataIntegrityError(
      `存档数据校验失败: 期望 ${save.checksum}, 实际 ${calculatedChecksum}`
    );
  }

  // 解析JSON
  let state: unknown;
  try {
    state = JSON.parse(jsonString);
  } catch {
    throw new SaveDataIntegrityError('存档数据JSON解析失败');
  }

  // 验证游戏状态结构
  if (!validateGameState(state)) {
    throw new SaveDataIntegrityError('存档数据结构无效');
  }

  return state;
}

/**
 * 将序列化存档转换为可存储的字符串
 */
export function saveToString(save: SerializedSave): string {
  return JSON.stringify(save);
}

/**
 * 从字符串解析序列化存档
 */
export function loadFromString(str: string): SerializedSave {
  try {
    const save = JSON.parse(str) as SerializedSave;

    // 验证存档结构
    if (
      typeof save.version !== 'string' ||
      typeof save.checksum !== 'string' ||
      typeof save.data !== 'string' ||
      typeof save.savedAt !== 'number'
    ) {
      throw new SaveDataIntegrityError('存档格式无效');
    }

    return save;
  } catch (e) {
    if (e instanceof SaveDataIntegrityError) {
      throw e;
    }
    throw new SaveDataIntegrityError('存档字符串解析失败');
  }
}

/**
 * 格式化游戏状态为可读的JSON字符串（用于预览）
 *
 * Requirements: 11.5
 */
export function formatGameStatePreview(state: GameState): string {
  return JSON.stringify(state, null, 2);
}
