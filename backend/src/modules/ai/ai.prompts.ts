export const PROMPT_VERSION = "v1.0.0";

interface LeadPromptInput {
  contactName?: string | null;
  company?: string | null;
  stage?: string | null;
  value?: number | null;
  score?: number | null;
  recentActivity?: string;
  activitiesCount?: number;
  paymentsCount?: number;
}

function compact(input?: string | null): string {
  if (!input) return "none";
  return input.replace(/\s+/g, " ").trim().slice(0, 350);
}

function buildBaseContext(data: LeadPromptInput): string {
  return [
    `PromptVersion: ${PROMPT_VERSION}`,
    `ContactName: ${data.contactName || "unknown"}`,
    `Company: ${data.company || "unknown"}`,
    `Stage: ${data.stage || "unknown"}`,
    `Value: ${data.value ?? 0}`,
    `Score: ${data.score ?? 0}`,
    `ActivitiesCount: ${data.activitiesCount ?? 0}`,
    `PaymentsCount: ${data.paymentsCount ?? 0}`,
    `RecentActivity: ${compact(data.recentActivity)}`
  ].join("\n");
}

export function buildLeadSummaryPrompt(data: LeadPromptInput): string {
  return [
    "You are an expert CRM AI assistant.",
    buildBaseContext(data),
    "Task: Summarize this lead in 2 concise sentences.",
    "Return JSON only with keys: summary, insights, nextAction, confidence, promptVersion.",
    "Use promptVersion exactly as provided in context."
  ].join("\n");
}

export function buildInsightPrompt(data: LeadPromptInput): string {
  return [
    "You are an expert CRM risk and opportunity analyst.",
    buildBaseContext(data),
    "Task: Analyze risk, opportunity, and urgency for this lead.",
    "Return JSON only with keys: summary, insights, nextAction, confidence, promptVersion.",
    "insights must be a short string array."
  ].join("\n");
}

export function buildActionPrompt(data: LeadPromptInput): string {
  return [
    "You are a sales operations strategist.",
    buildBaseContext(data),
    "Task: Suggest the next best action. Allowed actions: email, call, wait.",
    "Return JSON only with keys: summary, insights, nextAction, confidence, promptVersion.",
    "confidence must be a number between 0 and 1."
  ].join("\n");
}

export function buildUnifiedLeadAnalysisPrompt(data: LeadPromptInput): string {
  return [
    "You are an expert AI CRM copilot.",
    buildBaseContext(data),
    "Do three tasks together:",
    "1) Summarize the lead.",
    "2) Give key insights (risk, opportunity, urgency).",
    "3) Recommend next action: email, call, or wait.",
    "Return JSON only with this exact shape:",
    '{"summary":"string","insights":["string"],"nextAction":"email|call|wait","confidence":0.0,"promptVersion":"string"}',
    "Do not include markdown or explanation outside JSON."
  ].join("\n");
}

export function buildAIFollowupEmailPrompt(data: LeadPromptInput): string {
  return [
    "You are an elite enterprise account executive writing high-conversion follow-up emails.",
    buildBaseContext(data),
    "Task: Write a strategic follow-up email body in plain text.",
    "Goals:",
    "1) Show you remember the deal context and current stage.",
    "2) Offer specific business value (timeline clarity, risk reduction, faster decision path).",
    "3) Propose a concrete next step with 2 time-window options.",
    "Style requirements:",
    "- Personalized, direct, executive tone.",
    "- Avoid generic filler and avoid sounding like a template.",
    "- 120-180 words.",
    "- No markdown. Plain text only.",
    "- Include subject line on first line as: Subject: ...",
    "- Then body with short paragraphs and one bullet list (2 bullets max)."
  ].join("\n");
}
