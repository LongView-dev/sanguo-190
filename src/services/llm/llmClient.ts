/**
 * LLM客户端服务
 * 支持OpenAI/Claude等API调用，包含超时、重试和降级机制
 */

/**
 * LLM提供商类型
 */
export type LLMProvider = 'openai' | 'claude' | 'mock';

/**
 * LLM配置接口
 */
export interface LLMConfig {
  /** API提供商 */
  provider: LLMProvider;
  /** API密钥 */
  apiKey: string;
  /** API端点（可选，用于自定义端点） */
  endpoint?: string;
  /** 模型名称 */
  model?: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
}

/**
 * LLM请求参数
 */
export interface LLMRequest {
  /** 系统提示词 */
  systemPrompt: string;
  /** 用户消息 */
  userMessage: string;
  /** 最大生成token数 */
  maxTokens?: number;
  /** 温度参数 */
  temperature?: number;
}

/**
 * LLM响应
 */
export interface LLMResponse {
  /** 生成的文本 */
  content: string;
  /** 是否为降级响应 */
  isFallback: boolean;
  /** 错误信息（如果有） */
  error?: string;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Partial<LLMConfig> = {
  timeout: 30000, // 30秒超时
  maxRetries: 3,
  model: 'gpt-3.5-turbo',
};

/**
 * 默认端点
 */
const DEFAULT_ENDPOINTS: Record<LLMProvider, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  mock: '',
};

/**
 * LLM客户端类
 */
export class LLMClient {
  private config: Required<LLMConfig>;

  constructor(config: LLMConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      endpoint: DEFAULT_ENDPOINTS[config.provider],
      ...config,
    } as Required<LLMConfig>;
  }

  /**
   * 发送请求到LLM API
   */
  async send(request: LLMRequest): Promise<LLMResponse> {
    // Mock模式直接返回降级响应
    if (this.config.provider === 'mock') {
      return this.createFallbackResponse(request);
    }

    let lastError: Error | null = null;

    // 指数退避重试
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(request, attempt);
        return response;
      } catch (error) {
        lastError = error as Error;
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.config.maxRetries - 1) {
          await this.delay(this.calculateBackoff(attempt));
        }
      }
    }

    // 所有重试失败，返回降级响应
    console.warn('LLM API调用失败，使用降级方案:', lastError?.message);
    return this.createFallbackResponse(request, lastError?.message);
  }

  /**
   * 执行实际的API请求
   */
  private async makeRequest(
    request: LLMRequest,
    _attempt: number
  ): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const body = this.buildRequestBody(request);
      const headers = this.buildHeaders();

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API错误 (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = this.extractContent(data);

      return {
        content,
        isFallback: false,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 构建请求体
   */
  private buildRequestBody(request: LLMRequest): object {
    if (this.config.provider === 'openai') {
      return {
        model: this.config.model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userMessage },
        ],
        max_tokens: request.maxTokens ?? 150,
        temperature: request.temperature ?? 0.7,
      };
    }

    if (this.config.provider === 'claude') {
      return {
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: request.maxTokens ?? 150,
        system: request.systemPrompt,
        messages: [{ role: 'user', content: request.userMessage }],
      };
    }

    return {};
  }

  /**
   * 构建请求头
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.provider === 'openai') {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    } else if (this.config.provider === 'claude') {
      headers['x-api-key'] = this.config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }

    return headers;
  }

  /**
   * 从响应中提取内容
   */
  private extractContent(data: unknown): string {
    const response = data as Record<string, unknown>;

    if (this.config.provider === 'openai') {
      const choices = response.choices as Array<{
        message: { content: string };
      }>;
      return choices?.[0]?.message?.content ?? '';
    }

    if (this.config.provider === 'claude') {
      const content = response.content as Array<{ text: string }>;
      return content?.[0]?.text ?? '';
    }

    return '';
  }

  /**
   * 创建降级响应
   */
  private createFallbackResponse(
    _request: LLMRequest,
    error?: string
  ): LLMResponse {
    return {
      content: '',
      isFallback: true,
      error,
    };
  }

  /**
   * 计算指数退避延迟
   */
  private calculateBackoff(attempt: number): number {
    // 基础延迟1秒，指数增长，最大30秒
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // 添加随机抖动
    return delay + Math.random() * 1000;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config } as Required<LLMConfig>;
  }

  /**
   * 获取当前配置
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }
}

/**
 * 创建LLM客户端实例
 * 默认使用mock模式（无API密钥时）
 */
export function createLLMClient(config?: Partial<LLMConfig>): LLMClient {
  const finalConfig: LLMConfig = {
    provider: config?.provider ?? 'mock',
    apiKey: config?.apiKey ?? '',
    ...config,
  };

  return new LLMClient(finalConfig);
}

/**
 * 全局LLM客户端实例（单例）
 */
let globalClient: LLMClient | null = null;

/**
 * 获取全局LLM客户端
 */
export function getLLMClient(): LLMClient {
  if (!globalClient) {
    globalClient = createLLMClient();
  }
  return globalClient;
}

/**
 * 初始化全局LLM客户端
 */
export function initLLMClient(config: LLMConfig): void {
  globalClient = new LLMClient(config);
}
