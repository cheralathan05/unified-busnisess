import { db } from "../../config/db";
import { runAI } from "./ai.orchestrator";
import { env } from "../../config/env";
import { OllamaService } from "./ollama.service";

type JsonMap = Record<string, any>;

type MeetingRequirement = {
  title: string;
  category: "feature" | "technical" | "business" | "timeline";
  priority: "high" | "medium" | "low";
  confidence: number;
};

type MeetingTranscriptInput = {
  transcript: string;
  meetingTitle?: string;
  meetingDate?: string;
  lead: {
    name?: string;
    company?: string;
    stage?: string;
    value?: number;
    score?: number;
  };
};

type MeetingTranscriptAnalysis = {
  summary: string;
  requirements: MeetingRequirement[];
  nextAction: string;
  confidence: number;
  source: "ai" | "fallback";
  model: string;
};

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    const match = String(raw || "").match(/\{[\s\S]*\}/);
    if (!match) return fallback;
    return JSON.parse(match[0]) as T;
  } catch {
    return fallback;
  }
}

function normalizeRequirementCategory(value: unknown): MeetingRequirement["category"] {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "technical") return "technical";
  if (normalized === "business") return "business";
  if (normalized === "timeline") return "timeline";
  return "feature";
}

function normalizePriority(value: unknown): MeetingRequirement["priority"] {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "low") return "low";
  return "medium";
}

function toConfidence(value: unknown, fallback = 0.6) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function fallbackMeetingRequirements(transcript: string): MeetingRequirement[] {
  const lines = transcript
    .split(/[.!?\n]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 25)
    .slice(0, 20);

  const seen = new Set<string>();
  const requirements: MeetingRequirement[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const key = lower.replace(/\s+/g, " ");
    if (seen.has(key)) continue;

    const category: MeetingRequirement["category"] =
      /api|database|integration|auth|security|backend|frontend|webhook/.test(lower)
        ? "technical"
        : /deadline|timeline|week|month|milestone|eta|launch/.test(lower)
          ? "timeline"
          : /budget|payment|invoice|contract|approval|pricing/.test(lower)
            ? "business"
            : "feature";

    const priority: MeetingRequirement["priority"] =
      /urgent|asap|critical|must|blocking|immediately/.test(lower)
        ? "high"
        : /later|optional|nice to have|future/.test(lower)
          ? "low"
          : "medium";

    seen.add(key);
    requirements.push({
      title: line,
      category,
      priority,
      confidence: 0.55,
    });

    if (requirements.length >= 8) break;
  }

  return requirements;
}

class AIService {
  private readonly ollama = new OllamaService();

  private timeout(minMs: number, maxMs: number) {
    return Math.min(Math.max(env.OLLAMA_TIMEOUT_MS, minMs), maxMs);
  }

  async generateText(prompt: string): Promise<string> {
    const result = await this.ollama.generate(prompt, {
      timeoutMs: this.timeout(2500, 8000),
      model: env.OLLAMA_MODEL_TEXT
    });

    return String(result.text || "").trim();
  }

  async scoreLead(data: JsonMap): Promise<{ score: number; reasoning: string }> {
    const prompt = [
      "You are a CRM lead scoring engine.",
      "Return strict JSON only with keys: score (0-100 integer), reasoning (string).",
      "Use behavior, engagement, communication, payment momentum, inactivity and stage signals.",
      `Lead data: ${JSON.stringify(data)}`
    ].join("\n");

    const response = await this.ollama.generate(prompt, {
      timeoutMs: this.timeout(2500, 7000),
      model: env.OLLAMA_MODEL_CLASSIFIER
    });

    const parsed = safeJsonParse<{ score?: number; reasoning?: string }>(response.text, {});
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score ?? 0))));

    return {
      score,
      reasoning: String(parsed.reasoning || "Scored using local Ollama phi3 model")
    };
  }

  async predictDeal(data: JsonMap): Promise<{
    probability: number;
    expectedCloseDate: string;
    confidence: number;
    riskLevel: "low" | "medium" | "high";
    riskFactors: string[];
  }> {
    const prompt = [
      "You are a CRM deal prediction engine.",
      "Return strict JSON only with keys:",
      "probability (0-100 integer), expectedCloseDate (ISO string), confidence (0-1), riskLevel (low|medium|high), riskFactors (string[]).",
      "Use historical and current signals from data.",
      `Deal data: ${JSON.stringify(data)}`
    ].join("\n");

    const response = await this.ollama.generate(prompt, {
      timeoutMs: this.timeout(3000, 8500),
      model: env.OLLAMA_MODEL_TEXT
    });

    const fallbackDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const parsed = safeJsonParse<{
      probability?: number;
      expectedCloseDate?: string;
      confidence?: number;
      riskLevel?: "low" | "medium" | "high";
      riskFactors?: string[];
    }>(response.text, {});

    const probability = Math.max(0, Math.min(100, Math.round(Number(parsed.probability ?? 50))));
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.6)));

    return {
      probability,
      expectedCloseDate: parsed.expectedCloseDate || fallbackDate,
      confidence,
      riskLevel: parsed.riskLevel === "high" || parsed.riskLevel === "medium" ? parsed.riskLevel : "low",
      riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : []
    };
  }

  async analyzeSentiment(text: string): Promise<{
    sentiment: "positive" | "neutral" | "negative";
    intent: string;
    engagementScore: number;
  }> {
    const prompt = [
      "You are a CRM sentiment and intent classifier.",
      "Return strict JSON only with keys: sentiment (positive|neutral|negative), intent (string), engagementScore (0-100 integer).",
      `Message: ${text}`
    ].join("\n");

    const response = await this.ollama.generate(prompt, {
      timeoutMs: this.timeout(2000, 6500),
      model: env.OLLAMA_MODEL_CLASSIFIER
    });

    const parsed = safeJsonParse<{ sentiment?: string; intent?: string; engagementScore?: number }>(
      response.text,
      {}
    );

    const sentiment =
      parsed.sentiment === "positive" || parsed.sentiment === "negative" ? parsed.sentiment : "neutral";

    return {
      sentiment,
      intent: String(parsed.intent || "follow_up"),
      engagementScore: Math.max(0, Math.min(100, Math.round(Number(parsed.engagementScore ?? 50))))
    };
  }

  async suggestNextAction(data: JsonMap): Promise<{
    action: string;
    channel: "email" | "whatsapp" | "call";
    message: string;
    confidence: number;
  }> {
    const prompt = [
      "You are an autonomous CRM next-step planner.",
      "Return strict JSON only with keys: action (string), channel (email|whatsapp|call), message (string), confidence (0-1).",
      "Action examples: Send Reminder, Call Client, Offer Discount, Schedule Meeting.",
      `Context: ${JSON.stringify(data)}`
    ].join("\n");

    const response = await this.ollama.generate(prompt, {
      timeoutMs: this.timeout(2500, 7500),
      model: env.OLLAMA_MODEL_TEXT
    });

    const parsed = safeJsonParse<{ action?: string; channel?: string; message?: string; confidence?: number }>(
      response.text,
      {}
    );

    const channel =
      parsed.channel === "email" || parsed.channel === "whatsapp" || parsed.channel === "call"
        ? parsed.channel
        : "email";

    return {
      action: String(parsed.action || "Send Reminder"),
      channel,
      message: String(parsed.message || "Following up to help move this deal forward."),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.65)))
    };
  }

  async analyzeMeetingTranscript(input: MeetingTranscriptInput): Promise<MeetingTranscriptAnalysis> {
    const prompt = [
      "You are an expert CRM meeting analyst.",
      "Analyze Google Meeting transcript and return strict JSON only.",
      "Required JSON shape:",
      "{",
      '  "summary": "string",',
      '  "requirements": [{ "title": "string", "category": "feature|technical|business|timeline", "priority": "high|medium|low", "confidence": 0.0 }],',
      '  "nextAction": "string",',
      '  "confidence": 0.0',
      "}",
      "Focus on actionable requirements and implementation constraints.",
      `Lead context: ${JSON.stringify(input.lead)}`,
      `Meeting title: ${String(input.meetingTitle || "Google Meeting")}`,
      `Meeting date: ${String(input.meetingDate || "")}`,
      `Transcript: ${input.transcript}`,
    ].join("\n");

    const response = await this.ollama.generate(prompt, {
      timeoutMs: this.timeout(3000, 9000),
      model: env.OLLAMA_MODEL_REASONING,
    });

    const parsed = safeJsonParse<{
      summary?: string;
      requirements?: Array<{
        title?: string;
        category?: string;
        priority?: string;
        confidence?: number;
      }>;
      nextAction?: string;
      confidence?: number;
    }>(response.text, {});

    const normalizedRequirements = Array.isArray(parsed.requirements)
      ? parsed.requirements
          .map((item) => ({
            title: String(item?.title || "").trim(),
            category: normalizeRequirementCategory(item?.category),
            priority: normalizePriority(item?.priority),
            confidence: toConfidence(item?.confidence, 0.6),
          }))
          .filter((item) => item.title.length >= 6)
          .slice(0, 10)
      : [];

    const fallbackRequirements = fallbackMeetingRequirements(input.transcript);
    const useFallback =
      response.timedOut ||
      !String(parsed.summary || "").trim() ||
      normalizedRequirements.length === 0;

    const fallbackSummary = `Meeting analysis for ${input.lead.company || "lead"}: extracted ${fallbackRequirements.length} requirement(s) from transcript.`;
    const fallbackNextAction =
      fallbackRequirements.length > 0
        ? `Convert top ${Math.min(3, fallbackRequirements.length)} requirements into scoped tasks and confirm with client.`
        : "Schedule a follow-up call to clarify requirements and timeline.";

    return {
      summary: useFallback ? fallbackSummary : String(parsed.summary || "").trim(),
      requirements: useFallback ? fallbackRequirements : normalizedRequirements,
      nextAction: useFallback ? fallbackNextAction : String(parsed.nextAction || "").trim(),
      confidence: useFallback ? 0.58 : toConfidence(parsed.confidence, 0.72),
      source: useFallback ? "fallback" : "ai",
      model: env.OLLAMA_MODEL_REASONING,
    };
  }

  async validatePaymentProof(data: {
    extractedText: string;
    expectedAmount: number;
    invoiceId?: string;
    paymentId?: string;
  }): Promise<{
    status: "verified" | "suspicious" | "rejected";
    amountMatches: boolean;
    transactionIdValid: boolean;
    detectedAmount: number | null;
    transactionId: string | null;
    reasoning: string;
  }> {
    const prompt = [
      "You are a payment proof verification engine.",
      "From OCR text, validate amount and transaction reference consistency.",
      "Return strict JSON only with keys:",
      "status (verified|suspicious|rejected), amountMatches (boolean), transactionIdValid (boolean), detectedAmount (number|null), transactionId (string|null), reasoning (string).",
      `Expected amount: ${data.expectedAmount}`,
      `Invoice ID: ${String(data.invoiceId || "")}`,
      `Payment ID: ${String(data.paymentId || "")}`,
      `OCR text: ${data.extractedText}`
    ].join("\n");

    const response = await this.ollama.generate(prompt, {
      timeoutMs: this.timeout(3000, 9000),
      model: env.OLLAMA_MODEL_REASONING
    });

    const parsed = safeJsonParse<{
      status?: "verified" | "suspicious" | "rejected";
      amountMatches?: boolean;
      transactionIdValid?: boolean;
      detectedAmount?: number | null;
      transactionId?: string | null;
      reasoning?: string;
    }>(response.text, {});

    return {
      status:
        parsed.status === "verified" || parsed.status === "suspicious" || parsed.status === "rejected"
          ? parsed.status
          : "suspicious",
      amountMatches: Boolean(parsed.amountMatches),
      transactionIdValid: Boolean(parsed.transactionIdValid),
      detectedAmount: Number.isFinite(parsed.detectedAmount as number)
        ? Number(parsed.detectedAmount)
        : null,
      transactionId: parsed.transactionId ? String(parsed.transactionId) : null,
      reasoning: String(parsed.reasoning || "Validated using local Ollama model")
    };
  }
}

export const aiService = new AIService();

export async function enrichLeadWithAI(leadId: string) {
  const lead = await db.lead.findUnique({
    where: { id: leadId }
  });

  if (!lead) return;

  const ai = await runAI(lead);

  await db.lead.update({
    where: { id: leadId },
    data: {
      summary: ai.summary,
      insights: ai.insights,
      nextAction: ai.nextAction,
      confidence: ai.confidence,
      priority: ai.priority,
      promptVersion: ai.promptVersion
    }
  });

  console.log("AI enriched lead:", leadId, {
    nextAction: ai.nextAction,
    confidence: ai.confidence
  });

  return ai;
}
