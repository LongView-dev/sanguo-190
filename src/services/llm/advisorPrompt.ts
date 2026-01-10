/**
 * 军师Prompt构建器
 * 定义军师性格特征模板，实现上下文数据格式化
 */

import type { City, General, Faction } from '../../types';

/**
 * 军师性格特征接口
 */
export interface AdvisorPersonality {
  /** 军师ID */
  id: string;
  /** 军师名称 */
  name: string;
  /** 性格描述 */
  description: string;
  /** 说话风格 */
  speakingStyle: string;
  /** 决策倾向 */
  decisionTendency: 'aggressive' | 'balanced' | 'cautious';
  /** 特殊口头禅或习惯用语 */
  catchphrases: string[];
}

/**
 * 威胁信息接口
 */
export interface ThreatInfo {
  /** 敌方势力名称 */
  factionName: string;
  /** 敌方城市名称 */
  cityName: string;
  /** 敌方兵力 */
  troops: number;
  /** 距离（相邻城市数） */
  distance: number;
}

/**
 * 军师建议请求上下文
 */
export interface AdvisorContext {
  /** 当前城市数据 */
  city: City;
  /** 城市名称 */
  cityName: string;
  /** 附近威胁 */
  nearbyThreats: ThreatInfo[];
  /** 势力资源 */
  factionResources: {
    gold: number;
    grain: number;
    troops: number;
  };
  /** 当前日期 */
  currentDate: { year: number; month: number };
  /** 玩家势力名称 */
  factionName: string;
}

/**
 * 预定义军师性格模板
 */
export const ADVISOR_PERSONALITIES: Record<string, AdvisorPersonality> = {
  guojia: {
    id: 'guojia',
    name: '郭嘉',
    description: '曹操麾下首席谋士，才华横溢，洞察人心，善于奇谋',
    speakingStyle: '自信而略带傲气，言辞犀利，常以"嘉以为"开头',
    decisionTendency: 'aggressive',
    catchphrases: [
      '嘉以为',
      '此乃天赐良机',
      '主公明鉴',
      '兵贵神速',
    ],
  },
  zhugeLiang: {
    id: 'zhugeLiang',
    name: '诸葛亮',
    description: '卧龙先生，智谋无双，谨慎稳重，善于长远规划',
    speakingStyle: '沉稳睿智，引经据典，常以"亮观之"开头',
    decisionTendency: 'cautious',
    catchphrases: [
      '亮观之',
      '此事需从长计议',
      '主公三思',
      '谋定而后动',
    ],
  },
  zhouYu: {
    id: 'zhouYu',
    name: '周瑜',
    description: '江东大都督，文武双全，气度不凡，善于水战',
    speakingStyle: '儒雅自信，胸有成竹，常以"瑜以为"开头',
    decisionTendency: 'balanced',
    catchphrases: [
      '瑜以为',
      '此计可行',
      '将军且听我一言',
      '运筹帷幄',
    ],
  },
  jiaxu: {
    id: 'jiaxu',
    name: '贾诩',
    description: '毒士贾诩，深谋远虑，明哲保身，善于揣摩人心',
    speakingStyle: '低调谨慎，言简意赅，常以"诩窃以为"开头',
    decisionTendency: 'cautious',
    catchphrases: [
      '诩窃以为',
      '此事不可不察',
      '主公宜慎之',
      '明哲保身',
    ],
  },
  fazheng: {
    id: 'fazheng',
    name: '法正',
    description: '蜀汉谋主，睚眦必报，善于把握战机',
    speakingStyle: '直率果断，不拘小节，常以"正以为"开头',
    decisionTendency: 'aggressive',
    catchphrases: [
      '正以为',
      '机不可失',
      '当断则断',
      '此乃良机',
    ],
  },
};

/**
 * 军师系统提示词模板
 */
export function buildAdvisorSystemPrompt(personality: AdvisorPersonality): string {
  return `你是三国时代的著名谋士${personality.name}。

角色设定：
${personality.description}

说话风格：
${personality.speakingStyle}

常用语：${personality.catchphrases.join('、')}

决策倾向：${personality.decisionTendency === 'aggressive' ? '进取型，倾向于主动出击' : personality.decisionTendency === 'cautious' ? '谨慎型，倾向于稳扎稳打' : '平衡型，根据形势灵活应对'}

要求：
1. 保持角色性格一致性
2. 使用半文言文风格
3. 建议要具体可行
4. 回复不超过100字
5. 必须以你的习惯用语开头`;
}

/**
 * 构建军师建议请求Prompt
 */
export function buildAdvisorPrompt(context: AdvisorContext): string {
  const { city, cityName, nearbyThreats, factionResources, currentDate, factionName } = context;

  let prompt = `当前形势：
时间：${currentDate.year}年${currentDate.month}月
势力：${factionName}

当前城市：${cityName}
- 人口：${city.resources.population.toLocaleString()}
- 商业：${city.resources.commerce}
- 农业：${city.resources.agriculture}
- 防御：${city.resources.defense}
- 民忠：${city.resources.loyalty}
- 驻军：${city.stationedGenerals.length}名武将

势力总资源：
- 金钱：${factionResources.gold.toLocaleString()}
- 粮草：${factionResources.grain.toLocaleString()}
- 总兵力：${factionResources.troops.toLocaleString()}`;

  // 添加威胁信息
  if (nearbyThreats.length > 0) {
    prompt += '\n\n周边威胁：';
    for (const threat of nearbyThreats) {
      prompt += `\n- ${threat.factionName}军于${threat.cityName}，兵力${threat.troops.toLocaleString()}，距离${threat.distance}城`;
    }
  } else {
    prompt += '\n\n周边暂无明显威胁。';
  }

  prompt += '\n\n请为主公提供当前形势下的策略建议。';

  return prompt;
}

/**
 * 格式化城市数据为上下文
 */
export function formatCityContext(
  city: City,
  cityName: string
): Pick<AdvisorContext, 'city' | 'cityName'> {
  return {
    city,
    cityName,
  };
}

/**
 * 格式化势力资源数据
 */
export function formatFactionResources(
  cities: City[],
  generals: General[]
): AdvisorContext['factionResources'] {
  let totalGold = 0;
  let totalGrain = 0;
  let totalTroops = 0;

  for (const city of cities) {
    totalGold += city.resources.gold;
    totalGrain += city.resources.grain;
  }

  for (const general of generals) {
    totalTroops += general.troops;
  }

  return {
    gold: totalGold,
    grain: totalGrain,
    troops: totalTroops,
  };
}

/**
 * 计算附近威胁
 */
export function calculateNearbyThreats(
  currentCity: City,
  allCities: Record<string, City>,
  factions: Record<string, Faction>,
  generals: Record<string, General>,
  playerFactionId: string
): ThreatInfo[] {
  const threats: ThreatInfo[] = [];

  // 检查相邻城市
  for (const connectedCityId of currentCity.connectedCities) {
    const connectedCity = allCities[connectedCityId];
    if (!connectedCity) continue;

    // 如果是敌方城市
    if (connectedCity.faction !== playerFactionId) {
      const enemyFaction = factions[connectedCity.faction];
      if (!enemyFaction) continue;

      // 计算该城市的兵力
      let cityTroops = 0;
      for (const generalId of connectedCity.stationedGenerals) {
        const general = generals[generalId];
        if (general) {
          cityTroops += general.troops;
        }
      }

      if (cityTroops > 0) {
        threats.push({
          factionName: enemyFaction.name,
          cityName: connectedCity.name,
          troops: cityTroops,
          distance: 1,
        });
      }
    }
  }

  // 按兵力排序，威胁大的在前
  threats.sort((a, b) => b.troops - a.troops);

  return threats;
}

/**
 * 构建完整的军师上下文
 */
export function buildAdvisorContext(
  currentCity: City,
  allCities: Record<string, City>,
  factions: Record<string, Faction>,
  generals: Record<string, General>,
  playerFactionId: string,
  currentDate: { year: number; month: number }
): AdvisorContext {
  const playerFaction = factions[playerFactionId];
  
  // 获取玩家势力的所有城市
  const playerCities = Object.values(allCities).filter(
    (city) => city.faction === playerFactionId
  );
  
  // 获取玩家势力的所有武将
  const playerGenerals = Object.values(generals).filter(
    (general) => general.faction === playerFactionId && general.isAlive
  );

  return {
    city: currentCity,
    cityName: currentCity.name,
    nearbyThreats: calculateNearbyThreats(
      currentCity,
      allCities,
      factions,
      generals,
      playerFactionId
    ),
    factionResources: formatFactionResources(playerCities, playerGenerals),
    currentDate,
    factionName: playerFaction?.name ?? playerFactionId,
  };
}

/**
 * 获取默认军师（根据势力）
 */
export function getDefaultAdvisor(factionId: string): AdvisorPersonality {
  const factionAdvisors: Record<string, string> = {
    caocao: 'guojia',
    liubei: 'zhugeLiang',
    sunquan: 'zhouYu',
    dongzhuo: 'jiaxu',
    yuanshao: 'jiaxu',
  };

  const advisorId = factionAdvisors[factionId] ?? 'zhouYu';
  return ADVISOR_PERSONALITIES[advisorId] ?? ADVISOR_PERSONALITIES.zhouYu;
}
