/**
 * 史官服务
 * 负责将游戏事件转化为演义风格的叙事文本
 */

import type { GameEvent, BattleEventData, DomesticEventData, GeneralEventData } from '../../types';
import { getLLMClient, type LLMResponse } from './llmClient';
import {
  HISTORIAN_SYSTEM_PROMPT,
  buildEventPrompt,
  type EventContext,
} from './historianPrompt';

/**
 * 降级模板 - 战斗事件
 */
const BATTLE_TEMPLATES = {
  win: [
    '{attacker}军大破{defender}军，斩获甚众。',
    '{attackerGeneral}率军击败{defenderGeneral}，{defender}军溃散。',
    '两军交锋，{attacker}军大胜，{defender}军败走。',
  ],
  lose: [
    '{attacker}军攻{defender}不克，损兵折将而退。',
    '{attackerGeneral}兵败，{defender}军乘胜追击。',
    '两军激战，{attacker}军不敌，败退而归。',
  ],
  draw: [
    '两军相持不下，各自收兵。',
    '{attacker}军与{defender}军激战，未分胜负。',
    '双方互有损伤，暂且罢兵。',
  ],
  duel: '{attackerGeneral}与{defenderGeneral}阵前单挑，{winner}获胜。',
  instantKill: '{winner}阵前斩杀敌将，敌军大乱！',
  capture: '{city}城易主，{attacker}军入城。',
};

/**
 * 降级模板 - 内政事件
 */
const DOMESTIC_TEMPLATES = {
  develop_commerce: '{executor}于{city}兴商贾，商业增{value}。',
  develop_agriculture: '{executor}于{city}劝农桑，农业增{value}。',
  recruit: '{executor}于{city}募兵{value}人。',
  search_talent: '{executor}于{city}访贤才。',
};

/**
 * 降级模板 - 武将事件
 */
const GENERAL_TEMPLATES = {
  death: '{general}战死沙场，壮烈殉国。',
  defect: '{general}叛离旧主，另投明主。',
  recruited: '{general}归附麾下，愿效犬马之劳。',
  promoted: '{general}功勋卓著，晋升要职。',
};

/**
 * 史官服务类
 */
export class HistorianService {
  private context: EventContext;

  constructor(context: EventContext) {
    this.context = context;
  }

  /**
   * 为单个事件生成叙事文本
   */
  async generateNarrative(event: GameEvent): Promise<string> {
    const client = getLLMClient();
    const prompt = buildEventPrompt(event, this.context);

    const response = await client.send({
      systemPrompt: HISTORIAN_SYSTEM_PROMPT,
      userMessage: prompt,
      maxTokens: 100,
      temperature: 0.8,
    });

    if (response.isFallback) {
      return this.generateFallbackNarrative(event);
    }

    return this.formatNarrative(response.content);
  }

  /**
   * 批量生成叙事文本
   */
  async generateNarratives(events: GameEvent[]): Promise<string[]> {
    const narratives: string[] = [];

    for (const event of events) {
      const narrative = await this.generateNarrative(event);
      narratives.push(narrative);
    }

    return narratives;
  }

  /**
   * 为事件列表生成叙事并更新事件对象
   */
  async processEvents(events: GameEvent[]): Promise<GameEvent[]> {
    const processedEvents: GameEvent[] = [];

    for (const event of events) {
      const narrative = await this.generateNarrative(event);
      processedEvents.push({
        ...event,
        narrative,
      });
    }

    return processedEvents;
  }

  /**
   * 生成降级叙事文本（当LLM不可用时）
   */
  private generateFallbackNarrative(event: GameEvent): string {
    switch (event.type) {
      case 'battle':
        return this.generateBattleFallback(event.data as BattleEventData);
      case 'domestic':
        return this.generateDomesticFallback(event.data as DomesticEventData);
      case 'general':
        return this.generateGeneralFallback(event.data as GeneralEventData);
      case 'disaster':
        return '天降灾祸，民不聊生。';
      default:
        return '有事发生。';
    }
  }

  /**
   * 生成战斗事件降级文本
   */
  private generateBattleFallback(data: BattleEventData): string {
    const attackerName = this.context.getFactionName(data.attacker);
    const defenderName = this.context.getFactionName(data.defender);
    const attackerGeneral = this.context.getGeneralName(data.attackerGeneral);
    const defenderGeneral = this.context.getGeneralName(data.defenderGeneral);

    let narrative = '';

    // 单挑事件
    if (data.duel?.occurred) {
      if (data.duel.instantKill && data.duel.winner) {
        const winner = this.context.getGeneralName(data.duel.winner);
        narrative = this.fillTemplate(BATTLE_TEMPLATES.instantKill, { winner });
      } else if (data.duel.winner) {
        const winner = this.context.getGeneralName(data.duel.winner);
        narrative = this.fillTemplate(BATTLE_TEMPLATES.duel, {
          attackerGeneral,
          defenderGeneral,
          winner,
        });
      }
    }

    // 战斗结果
    if (!narrative) {
      const templates = BATTLE_TEMPLATES[data.result];
      const template = templates[Math.floor(Math.random() * templates.length)];
      narrative = this.fillTemplate(template, {
        attacker: attackerName,
        defender: defenderName,
        attackerGeneral,
        defenderGeneral,
      });
    }

    // 城池攻占
    if (data.cityCapture) {
      const cityName = this.context.getCityName(data.cityCapture);
      narrative +=
        ' ' +
        this.fillTemplate(BATTLE_TEMPLATES.capture, {
          city: cityName,
          attacker: attackerName,
        });
    }

    return narrative;
  }

  /**
   * 生成内政事件降级文本
   */
  private generateDomesticFallback(data: DomesticEventData): string {
    const executor = this.context.getGeneralName(data.executor);
    const city = this.context.getCityName(data.city);
    const template = DOMESTIC_TEMPLATES[data.action];

    return this.fillTemplate(template, {
      executor,
      city,
      value: data.value.toString(),
    });
  }

  /**
   * 生成武将事件降级文本
   */
  private generateGeneralFallback(data: GeneralEventData): string {
    const general = this.context.getGeneralName(data.general);
    const template = GENERAL_TEMPLATES[data.event];

    return this.fillTemplate(template, { general });
  }

  /**
   * 填充模板
   */
  private fillTemplate(
    template: string,
    values: Record<string, string>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(values)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  /**
   * 格式化LLM返回的叙事文本
   */
  private formatNarrative(content: string): string {
    // 移除多余空白
    let formatted = content.trim();

    // 限制长度（不超过40字）
    if (formatted.length > 40) {
      formatted = formatted.substring(0, 40);
      // 尝试在标点处截断
      const lastPunctuation = Math.max(
        formatted.lastIndexOf('。'),
        formatted.lastIndexOf('，'),
        formatted.lastIndexOf('！'),
        formatted.lastIndexOf('？')
      );
      if (lastPunctuation > 20) {
        formatted = formatted.substring(0, lastPunctuation + 1);
      }
    }

    return formatted;
  }

  /**
   * 更新上下文
   */
  updateContext(context: EventContext): void {
    this.context = context;
  }
}

/**
 * 创建史官服务实例
 */
export function createHistorianService(context: EventContext): HistorianService {
  return new HistorianService(context);
}

/**
 * 从游戏状态创建事件上下文
 */
export function createEventContextFromState(
  generals: Record<string, { name: string }>,
  cities: Record<string, { name: string }>,
  factions: Record<string, { name: string }>
): EventContext {
  return {
    getGeneralName: (id: string) => generals[id]?.name ?? id,
    getCityName: (id: string) => cities[id]?.name ?? id,
    getFactionName: (id: string) => factions[id]?.name ?? id,
  };
}

/**
 * 解析LLM响应为叙事条目
 */
export function parseNarrativeResponse(response: LLMResponse): string[] {
  if (response.isFallback || !response.content) {
    return [];
  }

  // 按换行分割
  const lines = response.content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines;
}

/**
 * 序列化叙事文本为显示格式
 */
export function serializeNarrative(narrative: string): string {
  return narrative;
}

/**
 * 反序列化显示格式为叙事文本
 */
export function deserializeNarrative(serialized: string): string {
  return serialized;
}
