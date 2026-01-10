/**
 * 军师服务
 * 负责处理军师建议请求和响应
 */

import type { City, General, Faction } from '../../types';
import { getLLMClient } from './llmClient';
import {
  buildAdvisorSystemPrompt,
  buildAdvisorPrompt,
  buildAdvisorContext,
  getDefaultAdvisor,
  ADVISOR_PERSONALITIES,
  type AdvisorPersonality,
  type AdvisorContext,
  type ThreatInfo,
} from './advisorPrompt';

/**
 * 军师建议响应
 */
export interface AdvisorResponse {
  /** 建议文本 */
  advice: string;
  /** 军师名称 */
  advisorName: string;
  /** 是否为降级响应 */
  isFallback: boolean;
}

/**
 * 降级建议模板
 */
const FALLBACK_ADVICE_TEMPLATES: Record<AdvisorPersonality['decisionTendency'], string[]> = {
  aggressive: [
    '嘉以为，当此之时，宜主动出击，先发制人。',
    '正以为，机不可失，时不再来，主公当断则断。',
    '兵贵神速，主公宜速战速决，不可迟疑。',
  ],
  cautious: [
    '亮观之，此事需从长计议，不可轻举妄动。',
    '诩窃以为，主公宜稳扎稳打，积蓄实力。',
    '谋定而后动，知止而有得，主公三思。',
  ],
  balanced: [
    '瑜以为，当审时度势，相机而动。',
    '运筹帷幄之中，决胜千里之外，主公明鉴。',
    '此计可行，然需量力而为，不可冒进。',
  ],
};

/**
 * 根据形势生成降级建议
 */
function generateFallbackAdvice(
  personality: AdvisorPersonality,
  context: AdvisorContext
): string {
  const templates = FALLBACK_ADVICE_TEMPLATES[personality.decisionTendency];
  
  // 根据威胁情况选择建议
  if (context.nearbyThreats.length > 0) {
    const totalThreatTroops = context.nearbyThreats.reduce((sum, t) => sum + t.troops, 0);
    
    if (totalThreatTroops > context.factionResources.troops) {
      // 敌强我弱，建议谨慎
      if (personality.decisionTendency === 'aggressive') {
        return `${personality.catchphrases[0]}，敌军势大，主公宜暂避锋芒，待机而动。`;
      }
      return `${personality.catchphrases[0]}，敌军压境，主公宜固守城池，积蓄实力。`;
    } else {
      // 我强敌弱，可以进攻
      if (personality.decisionTendency === 'cautious') {
        return `${personality.catchphrases[0]}，虽我军占优，然不可轻敌，宜稳中求进。`;
      }
      return `${personality.catchphrases[0]}，我军兵强马壮，正是建功立业之时！`;
    }
  }
  
  // 无威胁时，建议发展
  if (context.city.resources.commerce < 300 || context.city.resources.agriculture < 300) {
    return `${personality.catchphrases[0]}，当务之急乃发展内政，充实府库。`;
  }
  
  if (context.factionResources.troops < 10000) {
    return `${personality.catchphrases[0]}，兵力尚薄，主公宜广募兵马，以备不时之需。`;
  }
  
  // 随机选择模板
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

/**
 * 军师服务类
 */
export class AdvisorService {
  private currentAdvisor: AdvisorPersonality;

  constructor(advisorId?: string) {
    this.currentAdvisor = advisorId
      ? ADVISOR_PERSONALITIES[advisorId] ?? ADVISOR_PERSONALITIES.zhouYu
      : ADVISOR_PERSONALITIES.zhouYu;
  }

  /**
   * 获取军师建议
   */
  async getAdvice(
    cityData: City,
    allCities: Record<string, City>,
    factions: Record<string, Faction>,
    generals: Record<string, General>,
    playerFactionId: string,
    currentDate: { year: number; month: number }
  ): Promise<AdvisorResponse> {
    // 构建上下文
    const context = buildAdvisorContext(
      cityData,
      allCities,
      factions,
      generals,
      playerFactionId,
      currentDate
    );

    // 构建提示词
    const systemPrompt = buildAdvisorSystemPrompt(this.currentAdvisor);
    const userPrompt = buildAdvisorPrompt(context);

    // 调用LLM
    const client = getLLMClient();
    const response = await client.send({
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 150,
      temperature: 0.8,
    });

    if (response.isFallback) {
      return {
        advice: generateFallbackAdvice(this.currentAdvisor, context),
        advisorName: this.currentAdvisor.name,
        isFallback: true,
      };
    }

    return {
      advice: this.formatAdvice(response.content),
      advisorName: this.currentAdvisor.name,
      isFallback: false,
    };
  }

  /**
   * 简化版获取建议（使用预构建的上下文）
   */
  async getAdviceWithContext(context: AdvisorContext): Promise<AdvisorResponse> {
    const systemPrompt = buildAdvisorSystemPrompt(this.currentAdvisor);
    const userPrompt = buildAdvisorPrompt(context);

    const client = getLLMClient();
    const response = await client.send({
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 150,
      temperature: 0.8,
    });

    if (response.isFallback) {
      return {
        advice: generateFallbackAdvice(this.currentAdvisor, context),
        advisorName: this.currentAdvisor.name,
        isFallback: true,
      };
    }

    return {
      advice: this.formatAdvice(response.content),
      advisorName: this.currentAdvisor.name,
      isFallback: false,
    };
  }

  /**
   * 格式化建议文本
   */
  private formatAdvice(content: string): string {
    let formatted = content.trim();

    // 限制长度（不超过100字）
    if (formatted.length > 100) {
      formatted = formatted.substring(0, 100);
      // 尝试在标点处截断
      const lastPunctuation = Math.max(
        formatted.lastIndexOf('。'),
        formatted.lastIndexOf('，'),
        formatted.lastIndexOf('！'),
        formatted.lastIndexOf('？')
      );
      if (lastPunctuation > 50) {
        formatted = formatted.substring(0, lastPunctuation + 1);
      }
    }

    return formatted;
  }

  /**
   * 切换军师
   */
  setAdvisor(advisorId: string): void {
    const advisor = ADVISOR_PERSONALITIES[advisorId];
    if (advisor) {
      this.currentAdvisor = advisor;
    }
  }

  /**
   * 根据势力设置默认军师
   */
  setAdvisorByFaction(factionId: string): void {
    this.currentAdvisor = getDefaultAdvisor(factionId);
  }

  /**
   * 获取当前军师信息
   */
  getCurrentAdvisor(): AdvisorPersonality {
    return this.currentAdvisor;
  }

  /**
   * 获取所有可用军师
   */
  getAvailableAdvisors(): AdvisorPersonality[] {
    return Object.values(ADVISOR_PERSONALITIES);
  }
}

/**
 * 创建军师服务实例
 */
export function createAdvisorService(advisorId?: string): AdvisorService {
  return new AdvisorService(advisorId);
}

/**
 * 创建基于势力的军师服务
 */
export function createAdvisorServiceForFaction(factionId: string): AdvisorService {
  const advisor = getDefaultAdvisor(factionId);
  return new AdvisorService(advisor.id);
}

// 重新导出类型
export type { AdvisorPersonality, AdvisorContext, ThreatInfo };
