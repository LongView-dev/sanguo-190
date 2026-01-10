/**
 * LLM服务模块导出
 */

// LLM客户端
export {
  LLMClient,
  createLLMClient,
  getLLMClient,
  initLLMClient,
  type LLMConfig,
  type LLMProvider,
  type LLMRequest,
  type LLMResponse,
} from './llmClient';

// 史官Prompt构建器
export {
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
} from './historianPrompt';

// 史官服务
export {
  HistorianService,
  createHistorianService,
  createEventContextFromState,
  parseNarrativeResponse,
  serializeNarrative,
  deserializeNarrative,
} from './historianService';

// 军师Prompt构建器
export {
  ADVISOR_PERSONALITIES,
  buildAdvisorSystemPrompt,
  buildAdvisorPrompt,
  buildAdvisorContext,
  formatCityContext,
  formatFactionResources,
  calculateNearbyThreats,
  getDefaultAdvisor,
  type AdvisorPersonality,
  type AdvisorContext,
  type ThreatInfo,
} from './advisorPrompt';

// 军师服务
export {
  AdvisorService,
  createAdvisorService,
  createAdvisorServiceForFaction,
  type AdvisorResponse,
} from './advisorService';
