import { env } from "../../config/env";

interface GenerateOptions {
  timeoutMs?: number;
  model?: string;
}

interface GenerateResult {
  text: string;
  timedOut: boolean;
}

class SimpleLimiter {
  private active = 0;
  private readonly maxConcurrent: number;
  private readonly queue: Array<() => void> = [];

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  async run<T>(job: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await job();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active += 1;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active += 1;
        resolve();
      });
    });
  }

  private release() {
    this.active = Math.max(this.active - 1, 0);
    const next = this.queue.shift();
    if (next) next();
  }
}

const limiter = new SimpleLimiter(2);

const FALLBACK_TEXT = JSON.stringify({
  summary: "AI unavailable",
  insights: [],
  nextAction: "wait",
  confidence: 0
});

function getFallbackResult(timedOut: boolean): GenerateResult {
  return {
    text: FALLBACK_TEXT,
    timedOut
  };
}

export class OllamaService {
  private readonly url = env.OLLAMA_URL.endsWith("/api/generate")
    ? env.OLLAMA_URL
    : `${env.OLLAMA_URL.replace(/\/$/, "")}/api/generate`;
  private readonly model = env.OLLAMA_MODEL;

  async generate(prompt: string, options: GenerateOptions = {}): Promise<GenerateResult> {
    return limiter.run(async () => {
      const timeoutMs = options.timeoutMs ?? env.OLLAMA_TIMEOUT_MS;

      const modelCandidates = [options.model, this.model, "llama3"].filter(
        (m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx
      );

      for (const model of modelCandidates) {
        const result = await this.generateWithModel(model, prompt, timeoutMs);
        if (!result.timedOut && result.text.trim().length > 0 && result.text !== FALLBACK_TEXT) {
          return result;
        }
      }

      return getFallbackResult(true);
    });
  }

  private async generateWithModel(
    model: string,
    prompt: string,
    timeoutMs: number
  ): Promise<GenerateResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        return getFallbackResult(false);
      }

      const data = (await res.json()) as { response?: string };
      return {
        text: data.response || "",
        timedOut: false
      };
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return getFallbackResult(true);
      }

      return getFallbackResult(false);
    } finally {
      clearTimeout(timeout);
    }
  }
}