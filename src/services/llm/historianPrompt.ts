/**
 * 史官Prompt构建器
 * 将游戏事件转换为LLM可理解的提示词，生成演义风格叙事
 */

import type {
  GameEvent,
  BattleEventData,
  DomesticEventData,
  GeneralEventData,
  DomesticActionType,
  GeneralEventType,
} from '../../types';

/**
 * 史官系统提示词
 */
export const HISTORIAN_SYSTEM_PROMPT = `你是一位三国时代的史官，负责记录天下大事。
你的任务是将游戏事件转化为简洁的古典演义风格文字。

要求：
1. 使用文言文或半文言文风格
2. 每条叙事不超过40个字
3. 突出人物和事件的戏剧性
4. 保持客观记录的史官口吻
5. 直接输出叙事文本，不要添加任何解释或标点符号外的内容`;

/**
 * 内政行动中文名称映射
 */
const DOMESTIC_ACTION_NAMES: Record<DomesticActionType, string> = {
  develop_commerce: '发展商业',
  develop_agriculture: '发展农业',
  recruit: '征兵',
  search_talent: '探索人才',
};

/**
 * 武将事件中文名称映射
 */
const GENERAL_EVENT_NAMES: Record<GeneralEventType, string> = {
  death: '阵亡',
  defect: '叛变',
  recruited: '加入',
  promoted: '晋升',
};

/**
 * 事件数据转JSON的接口
 * 用于LLM输入的结构化数据
 */
export interface EventJSON {
  type: string;
  timestamp: { year: number; month: number };
  data: Record<string, unknown>;
}

/**
 * 构建战斗事件Prompt
 */
export function buildBattlePrompt(
  event: GameEvent,
  context: EventContext
): string {
  const data = event.data as BattleEventData;

  const attackerName = context.getGeneralName(data.attackerGeneral);
  const defenderName = context.getGeneralName(data.defenderGeneral);
  const attackerFaction = context.getFactionName(data.attacker);
  const defenderFaction = context.getFactionName(data.defender);

  let prompt = `请为以下战斗事件生成演义风格叙事（不超过40字）：

时间：${event.timestamp.year}年${event.timestamp.month}月
攻方：${attackerFaction}军 主将${attackerName}
守方：${defenderFaction}军 主将${defenderName}
结果：${data.result === 'win' ? '攻方胜' : data.result === 'lose' ? '守方胜' : '平局'}
伤亡：攻方损失${data.casualties.attacker}人，守方损失${data.casualties.defender}人`;

  // 单挑事件
  if (data.duel?.occurred) {
    const duelWinner = data.duel.winner
      ? context.getGeneralName(data.duel.winner)
      : '未分胜负';
    if (data.duel.instantKill) {
      prompt += `\n特殊：${duelWinner}阵前斩杀敌将！`;
    } else {
      prompt += `\n单挑：两军主将阵前交锋，${duelWinner}获胜`;
    }
  }

  // 城池攻占
  if (data.cityCapture) {
    const cityName = context.getCityName(data.cityCapture);
    prompt += `\n攻占：${cityName}城易主`;
  }

  return prompt;
}

/**
 * 构建内政事件Prompt
 */
export function buildDomesticPrompt(
  event: GameEvent,
  context: EventContext
): string {
  const data = event.data as DomesticEventData;

  const executorName = context.getGeneralName(data.executor);
  const cityName = context.getCityName(data.city);
  const actionName = DOMESTIC_ACTION_NAMES[data.action];

  return `请为以下内政事件生成演义风格叙事（不超过40字）：

时间：${event.timestamp.year}年${event.timestamp.month}月
城市：${cityName}
执行者：${executorName}
行动：${actionName}
效果：+${data.value}`;
}

/**
 * 构建武将事件Prompt
 */
export function buildGeneralPrompt(
  event: GameEvent,
  context: EventContext
): string {
  const data = event.data as GeneralEventData;

  const generalName = context.getGeneralName(data.general);
  const eventName = GENERAL_EVENT_NAMES[data.event];

  let prompt = `请为以下武将事件生成演义风格叙事（不超过40字）：

时间：${event.timestamp.year}年${event.timestamp.month}月
武将：${generalName}
事件：${eventName}`;

  if (data.details) {
    prompt += `\n详情：${data.details}`;
  }

  // 特殊处理阵亡事件
  if (data.event === 'death') {
    prompt += '\n\n请描述武将战死的壮烈场面。';
  }

  return prompt;
}

/**
 * 事件上下文接口
 * 用于获取游戏实体的名称
 */
export interface EventContext {
  getGeneralName(id: string): string;
  getCityName(id: string): string;
  getFactionName(id: string): string;
}

/**
 * 构建事件Prompt（统一入口）
 */
export function buildEventPrompt(
  event: GameEvent,
  context: EventContext
): string {
  switch (event.type) {
    case 'battle':
      return buildBattlePrompt(event, context);
    case 'domestic':
      return buildDomesticPrompt(event, context);
    case 'general':
      return buildGeneralPrompt(event, context);
    case 'disaster':
      return buildDisasterPrompt(event, context);
    default:
      return buildGenericPrompt(event);
  }
}

/**
 * 构建灾害事件Prompt
 */
export function buildDisasterPrompt(
  event: GameEvent,
  _context: EventContext
): string {
  return `请为以下灾害事件生成演义风格叙事（不超过40字）：

时间：${event.timestamp.year}年${event.timestamp.month}月
事件：天灾降临`;
}

/**
 * 构建通用事件Prompt
 */
export function buildGenericPrompt(event: GameEvent): string {
  return `请为以下事件生成演义风格叙事（不超过40字）：

时间：${event.timestamp.year}年${event.timestamp.month}月
类型：${event.type}`;
}

/**
 * 将事件转换为JSON结构（用于LLM输入）
 * 确保JSON结构完整性
 */
export function eventToJSON(event: GameEvent): EventJSON {
  return {
    type: event.type,
    timestamp: {
      year: event.timestamp.year,
      month: event.timestamp.month,
    },
    data: { ...event.data } as Record<string, unknown>,
  };
}

/**
 * 验证事件JSON结构完整性
 */
export function validateEventJSON(json: unknown): json is EventJSON {
  if (typeof json !== 'object' || json === null) {
    return false;
  }

  const obj = json as Record<string, unknown>;

  // 检查type字段
  if (typeof obj.type !== 'string') {
    return false;
  }

  // 检查timestamp字段
  if (typeof obj.timestamp !== 'object' || obj.timestamp === null) {
    return false;
  }

  const timestamp = obj.timestamp as Record<string, unknown>;
  if (
    typeof timestamp.year !== 'number' ||
    typeof timestamp.month !== 'number'
  ) {
    return false;
  }

  // 检查data字段
  if (typeof obj.data !== 'object' || obj.data === null) {
    return false;
  }

  return true;
}

/**
 * 批量转换事件为JSON
 */
export function eventsToJSON(events: GameEvent[]): EventJSON[] {
  return events.map(eventToJSON);
}
