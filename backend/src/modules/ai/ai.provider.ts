/**
 * Ollama-only AI provider layer.
 * No cloud fallback is allowed.
 */

import { env } from "../../config/env";
import { OllamaService } from "./ollama.service";

export interface AIProviderResponse {
  text: string;
  provider: "ollama" | "fallback";
  model: string;
  latency: number;
  confidence: number;
}

export interface AIProviderConfig {
  timeout?: number;
}

class AIProvider {
  private readonly ollama: OllamaService;
  private readonly timeout: number;

  constructor(config: AIProviderConfig = {}) {
    this.ollama = new OllamaService();
    this.timeout = config.timeout || env.OLLAMA_TIMEOUT_MS;
  }

  async callOllama(prompt: string): Promise<AIProviderResponse | null> {
    const start = Date.now();
    try {
      const response = await this.ollama.generate(prompt, {
        timeoutMs: this.timeout,
        model: env.OLLAMA_MODEL_REASONING
      });

      return {
        text: response.text,
        provider: "ollama",
        model: env.OLLAMA_MODEL_REASONING,
        latency: Date.now() - start,
        confidence: response.timedOut ? 0.3 : 0.85
      };
    } catch (error) {
      console.warn("Ollama failed:", (error as Error).message);
      return null;
    }
  }

  private getFallbackResponse(): AIProviderResponse {
    return {
      text: JSON.stringify({
        summary: "Unable to generate AI response",
        nextAction: "Require manual review",
        confidence: 0
      }),
      provider: "fallback",
      model: "local-fallback",
      latency: 0,
      confidence: 0.2
    };
  }

  async execute(prompt: string): Promise<AIProviderResponse> {
    const result = await this.callOllama(prompt);
    if (result) return result;
    return this.getFallbackResponse();
  }

  async executeRaceCondition(prompt: string): Promise<AIProviderResponse> {
    return this.execute(prompt);
  }
}

let provider: AIProvider | null = null;

export function initAIProvider(config?: AIProviderConfig): AIProvider {
  if (!provider) {
    provider = new AIProvider(config);
  }
  return provider;
}

export function getAIProvider(): AIProvider {
  if (!provider) {
    provider = new AIProvider();
  }
  return provider;
}

export default {
  initAIProvider,
  getAIProvider
};
