// 存档序列化/反序列化服务
export {
  serializeGameState,
  deserializeGameState,
  validateGameState,
  calculateChecksum,
  saveToString,
  loadFromString,
  formatGameStatePreview,
  SaveDataIntegrityError,
  SaveVersionError,
  SAVE_VERSION,
  type SerializedSave,
} from './saveLoad';

// 浏览器存储服务
export {
  storageService,
  MAX_SAVE_SLOTS,
  type SaveSlotInfo,
  type StorageService,
} from './storageService';

// LLM服务
export {
  // LLM客户端
  LLMClient,
  createLLMClient,
  getLLMClient,
  initLLMClient,
  type LLMConfig,
  type LLMProvider,
  type LLMRequest,
  type LLMResponse,
  // 史官Prompt构建器
  HISTORIAN_SYSTEM_PROMPT,
  buildEventPrompt,
  buildBattlePrompt,
  buildDomesticPrompt,
  buildGeneralPrompt,
  buildDisasterPrompt,
  buildGenericPrompt,
  eventToJSON,
  eventsToJSON,
  validateEventJSON,
  type EventContext,
  type EventJSON,
  // 史官服务
  HistorianService,
  createHistorianService,
  createEventContextFromState,
  parseNarrativeResponse,
  serializeNarrative,
  deserializeNarrative,
} from './llm';
