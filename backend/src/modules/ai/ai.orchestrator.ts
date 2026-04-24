import { calculateScore } from "./scoring.service";
import { analyzeSentiment } from "./sentiment.service";
import { gatherAIContext } from "./ai.context";
import { buildUnifiedLeadAnalysisPrompt, PROMPT_VERSION } from "./ai.prompts";
import { getSafeDefaultAIResponse, parseAIResponse } from "./ai.parser";
import { aiCache } from "./ai.cache";
import { aiLock } from "./ai.lock";
import { logAIEvent } from "./ai.logs";
import { aiService } from "./ai.service";

type Priority = "high" | "medium" | "low";

export interface AIResult {
  score: number;
  priority: Priority;
  probability: number;
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
  insights: string[];
  nextAction: string;
  confidence: number;
  promptVersion: string;
}

function isUnavailableSummary(summary: string): boolean {
  const s = String(summary || "").toLowerCase();
  return (
    s.includes("ai unavailable") ||
    s.includes("unable to generate") ||
    s.includes("summary unavailable")
  );
}

function inferNextActionFromStage(stage: string): string {
  const normalized = String(stage || "").toLowerCase();
  if (["discovery", "qualified", "new"].includes(normalized)) return "call";
  if (["proposal", "negotiation", "review"].includes(normalized)) return "email";
  return "call";
}

function buildDeterministicFallback(
  lead: any,
  score: number,
  priority: Priority,
  probability: number
) {
  const stage = String(lead?.stage || "Discovery");
  const company = String(lead?.company || "this account");
  const value = Number(lead?.value || 0);
  const nextAction = inferNextActionFromStage(stage);

  return {
    summary:
      `Lead ${lead?.name || "contact"} at ${company} is currently in ${stage} stage ` +
      `with estimated value ${value > 0 ? `$${value.toLocaleString()}` : "not set"}. ` +
      `Priority is ${priority} and close likelihood is ${Math.round(probability * 100)}%.`,
    insights: [
      `Current stage: ${stage}`,
      `Estimated deal value: ${value > 0 ? `$${value.toLocaleString()}` : "not set"}`,
      `Recommended immediate channel: ${nextAction}`
    ],
    nextAction,
    confidence: 0.35,
    promptVersion: PROMPT_VERSION
  };
}

function normalizePriority(score: number): Priority {
  if (score > 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function computeRuleConfidence(
  score: number,
  activityCount: number,
  paymentCount: number
): number {
  let confidence = 0.45;
  if (score >= 80) confidence += 0.25;
  else if (score >= 50) confidence += 0.15;

  if (activityCount > 0) confidence += 0.1;
  if (paymentCount > 0) confidence += 0.1;

  return Math.max(0, Math.min(1, confidence));
}

function mergeConfidence(ruleConfidence: number, llmConfidence: number): number {
  const merged = ruleConfidence * 0.4 + llmConfidence * 0.6;
  return Math.round(Math.max(0, Math.min(1, merged)) * 100) / 100;
}

export async function runAI(lead: any): Promise<AIResult> {
  const [aiScore, aiPrediction, aiSentiment] = await Promise.all([
    aiService.scoreLead(lead),
    aiService.predictDeal(lead),
    aiService.analyzeSentiment(String(lead?.lastMessage || ""))
  ]);

  const score = aiScore.score || calculateScore(lead);
  const priority = normalizePriority(score);
  const probability = Math.max(0, Math.min(1, Number(aiPrediction.probability || 0) / 100));
  const sentiment = aiSentiment.sentiment || analyzeSentiment(lead?.lastMessage);

  const fallback = buildDeterministicFallback(lead, score, priority, probability);
  const fallbackResult: AIResult = {
    score,
    priority,
    probability,
    sentiment,
    summary: fallback.summary,
    insights: fallback.insights,
    nextAction: fallback.nextAction,
    confidence: fallback.confidence,
    promptVersion: PROMPT_VERSION
  };

  if (!lead?.id) {
    return fallbackResult;
  }

  const leadId = String(lead.id);
  const updatedAt = lead.updatedAt ? new Date(lead.updatedAt) : new Date();
  const cacheKey = aiCache.getKey(leadId, updatedAt);
  const cached = aiCache.get<AIResult>(cacheKey);
  if (cached) return cached;

  if (!aiLock.acquire(leadId)) {
    return fallbackResult;
  }

  const start = Date.now();
  try {
    const context = await gatherAIContext(leadId);
    if (!context) {
      return fallbackResult;
    }

    const prompt = buildUnifiedLeadAnalysisPrompt({
      company: context.lead.company,
      stage: context.lead.stage,
      value: context.lead.value,
      score,
      activitiesCount: context.activities.length,
      paymentsCount: context.payments.length,
      recentActivity: context.activities[0]?.text || context.activities[0]?.type || "none"
    });

    const llmText = await aiService.generateText(prompt);
    const llmResult = { text: llmText, timedOut: false };
    const parsed = parseAIResponse(llmResult.text);

    const ruleConfidence = computeRuleConfidence(
      score,
      context.activities.length,
      context.payments.length
    );

    const resolved =
      isUnavailableSummary(parsed.summary) || (parsed.confidence === 0 && parsed.nextAction === "wait")
        ? fallback
        : parsed;

    const suggestion = await aiService.suggestNextAction({
      lead: context.lead,
      activities: context.activities,
      payments: context.payments,
      score,
      probability: aiPrediction.probability,
      sentiment: aiSentiment
    });

    const merged: AIResult = {
      score,
      priority,
      probability,
      sentiment,
      summary: resolved.summary,
      insights: resolved.insights,
      nextAction: suggestion.action || resolved.nextAction,
      confidence: mergeConfidence(ruleConfidence, resolved.confidence),
      promptVersion: resolved.promptVersion || PROMPT_VERSION
    };

    aiCache.set(cacheKey, merged);

    await logAIEvent({
      leadId,
      userId: context.lead.userId,
      prompt,
      response: llmResult.text,
      latencyMs: Date.now() - start,
      success: !llmResult.timedOut,
      promptVersion: merged.promptVersion
    });

    return merged;
  } catch (error: any) {
    await logAIEvent({
      leadId,
      userId: lead.userId,
      prompt: "orchestrator.failure",
      response: undefined,
      latencyMs: Date.now() - start,
      success: false,
      promptVersion: PROMPT_VERSION,
      error: error?.message || "unknown"
    });

    return fallbackResult;
  } finally {
    aiLock.release(leadId);
  }
}