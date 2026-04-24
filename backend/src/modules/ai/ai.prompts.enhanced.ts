/**
 * 🧠 ADVANCED PROMPT ENGINE
 * Generates structured, context-aware prompts for AI
 * Turns raw data into intelligent input
 */

import { AIContext } from "./ai.context";
import { AISignals } from "./ai.signals";

export type PromptType = "ANALYSIS" | "GENERATION" | "DECISION" | "SUMMARY";

export interface AIPrompt {
  type: PromptType;
  content: string;
  context: {
    leadId: string;
    userId: string;
    signals: AISignals;
  };
  expectedOutput: string;
}

/**
 * Format currency for prompt
 */
function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

/**
 * Format date as human-readable
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/**
 * Build ANALYSIS prompt
 * Purpose: Assess risk, predict probability, identify issues
 */
function buildAnalysisPrompt(
  context: AIContext,
  signals: AISignals
): string {
  const activityTimeline = context.activities
    .slice(0, 5)
    .map((a) => `- ${formatDate(a.createdAt)}: ${a.type} ${a.text ? `"${a.text}"` : ""}`)
    .join("\n");

  const paymentSummary =
    context.payments.length > 0
      ? context.payments
          .slice(0, 3)
          .map((p) => `- ${formatDate(p.createdAt)}: ${formatCurrency(p.amount)} (${p.status})`)
          .join("\n")
      : "No payments yet";

  return `
You are a sales intelligence AI analyzing a B2B sales opportunity.

LEAD DETAILS:
- Company: ${context.lead.company}
- Current Stage: ${context.lead.stage}
- Deal Value: ${formatCurrency(context.lead.value)}
- Internal Score: ${context.lead.score}/100
- Last Updated: ${formatDate(context.lead.updatedAt)}

ENGAGEMENT SIGNALS:
- Engagement Score: ${signals.engagementScore}/100
- Last Activity: ${signals.lastActivityGap} days ago
- Deal Velocity: ${signals.dealVelocity}
- Deal Health: ${signals.dealHealth}

RECENT ACTIVITY:
${activityTimeline}

PAYMENT HISTORY:
${paymentSummary}

TASK:
Analyze this opportunity and provide:
1. Risk assessment (HIGH/MEDIUM/LOW)
2. Close probability (0-100%)
3. Major risk factors (2-3 key issues)
4. Strongest signals pointing toward close
5. Overall urgency level

Be direct, fact-based, and concise.
Output in JSON format.
`;
}

/**
 * Build GENERATION prompt
 * Purpose: Generate email, message, call script
 */
function buildGenerationPrompt(
  context: AIContext,
  signals: AISignals,
  generationType: "EMAIL" | "WHATSAPP" | "CALL_SCRIPT"
): string {
  const lastActivity = context.activities[0];
  const lastActivityType = lastActivity ? lastActivity.type : "unknown";
  const daysSinceContact = signals.lastActivityGap;

  let generationTask = "";
  switch (generationType) {
    case "EMAIL":
      generationTask = `Generate a professional follow-up email that:
- References their company (${context.lead.company})
- Acknowledges ${daysSinceContact} days since last contact
- Provides value (not just "checking in")
- Creates urgency without being pushy
- Call to action: specific next step`;

      break;
    case "WHATSAPP":
      generationTask = `Generate a casual WhatsApp message that:
- Is short (1-2 sentences)
- Uses their first name if possible
- References something from previous interaction
- Non-salesy, personable
- Includes call to action emoji`;

      break;
    case "CALL_SCRIPT":
      generationTask = `Generate a 30-second call opening that:
- Opens with rapport
- States clear purpose
- Acknowledges their time constraints
- Asks permission to continue
- If they say "yes", transitions to problem discovery`;

      break;
  }

  return `
You are a sales expert helping craft outreach.

LEAD INFORMATION:
- Company: ${context.lead.company}
- Deal Value: ${formatCurrency(context.lead.value)}
- Last Touch: ${daysSinceContact} days ago (${lastActivityType})
- Deal Stage: ${context.lead.stage}
- Deal Health: ${signals.dealHealth}

CONTEXT:
- Engagement is ${signals.engagementScore}/100
- This is a ${signals.urgency.toLowerCase()} priority
- Deal velocity is ${signals.dealVelocity.toLowerCase()}

TASK:
${generationTask}

Make it sound natural and authentic, not templated.
`;
}

/**
 * Build DECISION prompt
 * Purpose: AI decides next best action
 */
function buildDecisionPrompt(
  context: AIContext,
  signals: AISignals
): string {
  return `
You are an AI sales advisor recommending the next best action.

SITUATION:
- Company: ${context.lead.company}
- Deal Value: ${formatCurrency(context.lead.value)}
- Stage: ${context.lead.stage}
- Health: ${signals.dealHealth}
- Urgency: ${signals.urgency}
- Last Contact: ${signals.lastActivityGap} days ago

ENGAGEMENT:
- Engagement Score: ${signals.engagementScore}/100
- Close Probability: ${signals.closeProbability}%
- Deal Velocity: ${signals.dealVelocity}

CONSTRAINTS:
- Don't contact if less than 2 days since last activity
- Escalate to manager if value > $100,000 and CRITICAL urgency
- Suggest pause if deal is stalled (>14 days) and low value

DECISION OPTIONS:
1. IMMEDIATE_FOLLOWUP - Call or email today
2. SCHEDULE_CALL - Book formal meeting
3. SEND_VALUE_PACK - Share case study / resource
4. ESCALATE - Move to manager
5. NURTURE - Put in automated sequence
6. PAUSE - Stop contact (may resume later)
7. NO_ACTION - Not yet time to act

TASK:
Recommend ONE action and explain why.
Include exact action (e.g., "Send email about ROI case study from YourCompany")
Output in JSON: { "action": "...", "reason": "...", "nextSteps": [...] }
`;
}

/**
 * Build SUMMARY prompt
 * Purpose: Generate human-readable lead summary
 */
function buildSummaryPrompt(
  context: AIContext,
  signals: AISignals
): string {
  const recentActivities = context.activities.slice(0, 3);
  const totalPayments = context.payments.reduce((sum, p) => sum + p.amount, 0);

  return `
Summarize this sales opportunity concisely (2-3 sentences):

COMPANY: ${context.lead.company}
VALUE: ${formatCurrency(context.lead.value)}
STAGE: ${context.lead.stage}
ENGAGEMENT: ${signals.engagementScore}/100

RECENT ACTIVITY: ${
    recentActivities.length > 0
      ? recentActivities.map((a) => a.type).join(", ")
      : "None"
  }
PAYMENTS: ${formatCurrency(totalPayments)} received

Make it succinct and actionable for a sales manager.
`;
}

/**
 * Main prompt builder
 */
export function buildPrompt(
  type: PromptType,
  context: AIContext,
  signals: AISignals,
  generationType?: "EMAIL" | "WHATSAPP" | "CALL_SCRIPT"
): AIPrompt {
  let content = "";
  let expectedOutput = "";

  switch (type) {
    case "ANALYSIS":
      content = buildAnalysisPrompt(context, signals);
      expectedOutput =
        "JSON with risk, probability, factors, signals, urgency";
      break;
    case "GENERATION":
      if (!generationType)
        throw new Error("generationType required for GENERATION prompts");
      content = buildGenerationPrompt(context, signals, generationType);
      expectedOutput = `Professional ${generationType.toLowerCase()} text`;
      break;
    case "DECISION":
      content = buildDecisionPrompt(context, signals);
      expectedOutput = "JSON with action, reason, nextSteps";
      break;
    case "SUMMARY":
      content = buildSummaryPrompt(context, signals);
      expectedOutput = "2-3 sentence summary";
      break;
  }

  return {
    type,
    content,
    context: {
      leadId: context.lead.id,
      userId: context.lead.userId,
      signals
    },
    expectedOutput
  };
}

/**
 * Build a multi-phase prompt workflow
 * Phases: ANALYSIS -> DECISION -> GENERATION
 */
export function buildWorkflowPrompts(
  context: AIContext,
  signals: AISignals
): AIPrompt[] {
  return [
    buildPrompt("ANALYSIS", context, signals),
    buildPrompt("DECISION", context, signals),
    buildPrompt(
      "GENERATION",
      context,
      signals,
      signals.urgency === "CRITICAL" ? "EMAIL" : "WHATSAPP"
    ),
    buildPrompt("SUMMARY", context, signals)
  ];
}
