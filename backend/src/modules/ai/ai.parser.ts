import { PROMPT_VERSION } from "./ai.prompts";

export interface ParsedAIResponse {
  summary: string;
  insights: string[];
  nextAction: string;
  confidence: number;
  promptVersion: string;
}

const DEFAULT_AI_RESPONSE: ParsedAIResponse = {
  summary: "AI unavailable",
  insights: [],
  nextAction: "wait",
  confidence: 0,
  promptVersion: PROMPT_VERSION
};

function inferActionFromText(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("call") || lower.includes("phone")) return "call";
  if (lower.includes("email") || lower.includes("mail")) return "email";
  return "wait";
}

function parseFreeformResponse(raw: string): ParsedAIResponse {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const summary = cleaned.length > 0
    ? cleaned.slice(0, 1000)
    : DEFAULT_AI_RESPONSE.summary;

  const sentenceChunks = cleaned
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
    .slice(0, 3);

  return {
    summary,
    insights: sentenceChunks,
    nextAction: inferActionFromText(cleaned),
    confidence: cleaned.length > 0 ? 0.45 : 0,
    promptVersion: PROMPT_VERSION,
  };
}

function normalizeNextAction(value: unknown): string {
  if (typeof value !== "string") return "wait";
  const action = value.trim().toLowerCase();
  if (["email", "call", "wait"].includes(action)) return action;
  return "wait";
}

function normalizeConfidence(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeInsights(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 6);
}

function extractJsonCandidate(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return raw.slice(first, last + 1);
  }

  return null;
}

function safeJsonParse(input: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

export function parseAIResponse(raw: string): ParsedAIResponse {
  if (!raw || typeof raw !== "string") return DEFAULT_AI_RESPONSE;

  const candidate = extractJsonCandidate(raw);
  if (!candidate) return parseFreeformResponse(raw);

  const parsed = safeJsonParse(candidate);
  if (!parsed) return parseFreeformResponse(raw);

  const summary =
    typeof parsed.summary === "string" && parsed.summary.trim().length > 0
      ? parsed.summary.trim().slice(0, 1000)
      : DEFAULT_AI_RESPONSE.summary;

  const insights = normalizeInsights(parsed.insights);
  const nextAction = normalizeNextAction(parsed.nextAction);
  const confidence = normalizeConfidence(parsed.confidence);
  const promptVersion =
    typeof parsed.promptVersion === "string" && parsed.promptVersion.trim().length > 0
      ? parsed.promptVersion.trim()
      : PROMPT_VERSION;

  return {
    summary,
    insights,
    nextAction,
    confidence,
    promptVersion
  };
}

export function getSafeDefaultAIResponse(): ParsedAIResponse {
  return { ...DEFAULT_AI_RESPONSE };
}
