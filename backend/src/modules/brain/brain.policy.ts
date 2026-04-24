import { BrainDecisionResult, DecisionContext } from "./brain.types";

function withinRange(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function hoursSince(date: Date): number {
  const diff = Date.now() - date.getTime();
  return diff / (1000 * 60 * 60);
}

export function evaluateBrainPolicy(context: DecisionContext): BrainDecisionResult | null {
  const { lead, activities } = context;

  if (lead.score > 80) {
    return {
      type: "email_followup",
      recommendation: {
        title: "Send a personalized follow-up email",
        reason: `Lead score is ${lead.score}, which is a high-conversion signal.`,
        suggestedTemplate: "high_intent_followup"
      },
      confidence: withinRange(0.88 + (lead.score - 80) * 0.002, 0.88, 0.97)
    };
  }

  const latestActivity = activities[0];
  if (!latestActivity || hoursSince(latestActivity.createdAt) > 48) {
    return {
      type: "lead_follow_up",
      recommendation: {
        title: "Follow-up due to inactivity",
        reason: "No recent activity in the last 48 hours.",
        suggestedChannel: "email"
      },
      confidence: 0.82
    };
  }

  if (lead.stage.toLowerCase() === "proposal") {
    return {
      type: "call_schedule",
      recommendation: {
        title: "Schedule decision call",
        reason: "Lead is in proposal stage and benefits from a call touchpoint.",
        urgency: "medium"
      },
      confidence: 0.8
    };
  }

  return null;
}
