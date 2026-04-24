/**
 * 🧠 DECISION ENGINE
 * Converts AI output + signals into actionable decisions
 * Combines rule-based logic with AI reasoning
 */

import { db } from "../../config/db";
import { AIContext } from "./ai.context";
import { AISignals } from "./ai.signals";

export type NextAction =
  | "IMMEDIATE_FOLLOWUP"
  | "SCHEDULE_CALL"
  | "SEND_VALUE_PACK"
  | "ESCALATE"
  | "NURTURE"
  | "PAUSE"
  | "NO_ACTION";

export interface DecisionResult {
  action: NextAction;
  reasoning: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  recommendedChannel: "EMAIL" | "CALL" | "WHATSAPP" | "LINKEDIN";
  suggestedMessage?: string;
  estimatedFollowUpDay: number; // Days from now
  confidence: number; // 0-1
}

/**
 * Rule-based decision logic
 * These trigger BEFORE AI if conditions are met
 */
function applyRuleBasedDecision(
  context: AIContext,
  signals: AISignals
): DecisionResult | null {
  // RULE 1: Escalate high-value critical opportunities
  if (signals.urgency === "CRITICAL" && context.lead.value > 100000) {
    return {
      action: "ESCALATE",
      reasoning: "High-value deal at critical risk. Requires manager intervention.",
      priority: "CRITICAL",
      recommendedChannel: "CALL",
      estimatedFollowUpDay: 0,
      confidence: 0.95
    };
  }

  // RULE 2: Pause if too recent contact
  if (signals.lastActivityGap <= 1) {
    return {
      action: "NO_ACTION",
      reasoning: "Recent contact detected. Wait for response before re-engaging.",
      priority: "LOW",
      recommendedChannel: "EMAIL",
      estimatedFollowUpDay: 3,
      confidence: 0.9
    };
  }

  // RULE 3: Immediate followup if stalled and valuable
  if (
    signals.dealHealth === "STALLED" &&
    signals.lastActivityGap > 7 &&
    context.lead.value > 25000
  ) {
    return {
      action: "IMMEDIATE_FOLLOWUP",
      reasoning: `High-value deal stalled for ${signals.lastActivityGap} days. Immediate intervention needed.`,
      priority: "HIGH",
      recommendedChannel: "CALL",
      estimatedFollowUpDay: 0,
      confidence: 0.92
    };
  }

  // RULE 4: Multi-touch nurture if low engagement
  if (signals.engagementScore < 40 && signals.lastActivityGap > 3) {
    return {
      action: "NURTURE",
      reasoning: "Low engagement. Implement automated nurture sequence.",
      priority: "MEDIUM",
      recommendedChannel: "EMAIL",
      suggestedMessage: "Sharing valuable resource for your consideration",
      estimatedFollowUpDay: 2,
      confidence: 0.8
    };
  }

  // No rule matched, continue to AI decision
  return null;
}

/**
 * Parse AI decision output
 * AI returns JSON like: { action, reason, confidence }
 */
function parseAIDecision(
  aiOutput: string,
  context: AIContext,
  signals: AISignals
): DecisionResult {
  try {
    const parsed = JSON.parse(aiOutput);

    // Validate AI output has required fields
    if (!parsed.action) {
      throw new Error("AI response missing 'action' field");
    }

    // Map AI action to our action types
    const actionMap: Record<string, NextAction> = {
      IMMEDIATE_FOLLOWUP: "IMMEDIATE_FOLLOWUP",
      immediate_followup: "IMMEDIATE_FOLLOWUP",
      SCHEDULE_CALL: "SCHEDULE_CALL",
      schedule_call: "SCHEDULE_CALL",
      SEND_VALUE_PACK: "SEND_VALUE_PACK",
      send_value_pack: "SEND_VALUE_PACK",
      ESCALATE: "ESCALATE",
      escalate: "ESCALATE",
      NURTURE: "NURTURE",
      nurture: "NURTURE",
      PAUSE: "PAUSE",
      pause: "PAUSE",
      NO_ACTION: "NO_ACTION",
      no_action: "NO_ACTION"
    };

    const action = actionMap[parsed.action] || "NO_ACTION";

    // Determine priority from urgency + action
    let priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
    if (signals.urgency === "CRITICAL") priority = "CRITICAL";
    else if (signals.urgency === "HIGH") priority = "HIGH";
    else if (signals.urgency === "LOW") priority = "LOW";

    // Select channel based on action
    let recommendedChannel: "EMAIL" | "CALL" | "WHATSAPP" | "LINKEDIN" = "EMAIL";
    if (action === "SCHEDULE_CALL" || action === "ESCALATE")
      recommendedChannel = "CALL";
    if (context.lead.value < 5000) recommendedChannel = "WHATSAPP";

    // Estimate follow-up timing
    let estimatedFollowUpDay = 3;
    if (action === "IMMEDIATE_FOLLOWUP" || action === "ESCALATE")
      estimatedFollowUpDay = 0;
    else if (action === "SCHEDULE_CALL") estimatedFollowUpDay = 1;
    else if (action === "PAUSE") estimatedFollowUpDay = 7;

    return {
      action,
      reasoning: parsed.reason || parsed.reasoning || "AI decision",
      priority,
      recommendedChannel,
      suggestedMessage: parsed.message || parsed.email,
      estimatedFollowUpDay,
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7))
    };
  } catch (error) {
    console.error("Failed to parse AI decision:", error);
    // Return safe default if parse fails
    return {
      action: "NO_ACTION",
      reasoning: "Unable to parse AI response. Manual review required.",
      priority: "MEDIUM",
      recommendedChannel: "EMAIL",
      estimatedFollowUpDay: 3,
      confidence: 0.3
    };
  }
}

/**
 * Main decision engine
 * Combines rules + AI for final decision
 */
export async function makeDecision(
  context: AIContext,
  signals: AISignals,
  aiOutput?: { text: string; confidence: number }
): Promise<DecisionResult> {
  console.log("🧠 Making decision...");

  // Phase 1: Check rule-based decisions
  const ruleDecision = applyRuleBasedDecision(context, signals);
  if (ruleDecision) {
    console.log(`✅ Rule matched: ${ruleDecision.action}`);
    return ruleDecision;
  }

  console.log("📌 No rules matched, using AI decision...");

  // Phase 2: Parse AI decision
  if (!aiOutput || !aiOutput.text) {
    console.warn("⚠️ No AI output, returning default decision");
    return {
      action: "NO_ACTION",
      reasoning: "Insufficient data for decision",
      priority: "LOW",
      recommendedChannel: "EMAIL",
      estimatedFollowUpDay: 3,
      confidence: 0.4
    };
  }

  const decision = parseAIDecision(aiOutput.text, context, signals);

  // Boost confidence if AI model is confident
  decision.confidence = decision.confidence * 0.7 + aiOutput.confidence * 0.3;

  console.log(`✅ Decision made: ${decision.action}`);
  return decision;
}

/**
 * Store decision in database
 */
export async function storeDecision(
  userId: string,
  leadId: string,
  decision: DecisionResult,
  aiConfidence: number
): Promise<string> {
  const stored = await db.decision.create({
    data: {
      userId,
      leadId,
      type: mapActionToType(decision.action),
      input: JSON.stringify({ action: decision.action }),
      recommendation: JSON.stringify(decision),
      confidence: decision.confidence,
      status: "suggested"
    }
  });

  console.log(`💾 Decision stored: ${stored.id}`);
  return stored.id;
}

/**
 * Map action to decision type
 */
function mapActionToType(action: NextAction): string {
  switch (action) {
    case "IMMEDIATE_FOLLOWUP":
      return "email_followup";
    case "SCHEDULE_CALL":
      return "call_schedule";
    case "SEND_VALUE_PACK":
      return "resource_send";
    case "ESCALATE":
      return "escalation";
    default:
      return "task";
  }
}
