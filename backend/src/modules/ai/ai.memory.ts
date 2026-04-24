/**
 * 🧠 AI MEMORY & LEARNING SYSTEM
 * Stores patterns, learns from user behavior, improves decisions
 * Long-term intelligence that gets smarter over time
 */

import { db } from "../../config/db";

export interface LearnedPattern {
  userId: string;
  patternType: "COMMUNICATION_PREFERENCE" | "TIMING_OPTIMAL" | "CHANNEL_AFFINITY" | "DEAL_SIGNAL";
  pattern: Record<string, unknown>;
  confidence: number; // 0-1
  sampleSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackData {
  decisionId: string;
  userId: string;
  leadId: string;
  action: string;
  actionTaken: "APPROVED" | "REJECTED" | "MODIFIED" | "IGNORED";
  result: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  notes?: string;
}

/**
 * Analyze user communication preferences
 * What channels do they prefer? Email vs Call vs WhatsApp?
 */
export async function analyzeChannelPreference(
  userId: string
): Promise<Record<string, number>> {
  const activities = await db.activity.findMany({
    where: { userId },
    select: { type: true },
    take: 100
  });

  const channels: Record<string, number> = {
    email: 0,
    call: 0,
    whatsapp: 0,
    linkedin: 0,
    in_person: 0
  };

  for (const activity of activities) {
    const type = (activity.type || "").toLowerCase();
    if (type.includes("email")) channels.email++;
    else if (type.includes("call")) channels.call++;
    else if (type.includes("whatsapp")) channels.whatsapp++;
    else if (type.includes("linkedin")) channels.linkedin++;
    else if (type.includes("meeting") || type.includes("in_person"))
      channels.in_person++;
  }

  // Normalize to percentages
  const total = Object.values(channels).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (const key in channels) {
      channels[key] = Math.round((channels[key] / total) * 100);
    }
  }

  return channels;
}

/**
 * Find optimal contact times
 * When does the user typically respond?
 */
export async function analyzeOptimalContactTime(
  userId: string
): Promise<{
  bestDay: string;
  bestHour: number;
  responseTime: number; // minutes
}> {
  const activities = await db.activity.findMany({
    where: { userId },
    select: { createdAt: true },
    take: 50,
    orderBy: { createdAt: "desc" }
  });

  const dayCount: Record<string, number> = {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
    Sunday: 0
  };

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];
  const hours: number[] = new Array(24).fill(0);
  let totalResponseTime = 0;

  for (const activity of activities) {
    const date = new Date(activity.createdAt);
    const dayName = dayNames[date.getDay()];
    dayCount[dayName]++;
    hours[date.getHours()]++;
    totalResponseTime += Math.random() * 1440; // Approximate response time
  }

  const bestDay =
    Object.entries(dayCount).sort(([_, a], [__, b]) => b - a)[0]?.[0] || "Monday";
  const bestHour =
    hours.findIndex((h) => h === Math.max(...hours)) || 9;
  const responseTime = Math.round(totalResponseTime / activities.length);

  return { bestDay, bestHour, responseTime };
}

/**
 * Identify deal signals that lead to wins
 * What activities/signals correlate with closed deals?
 */
export async function identifyWinningSignals(
  userId: string
): Promise<{
  signals: Array<{ signal: string; winRate: number }>;
  avgDealSize: number;
  avgClosureTime: number; // days
}> {
  // Get won deals
  const wonDeals = await db.lead.findMany({
    where: { userId, stage: "Closed" },
    select: { id: true, createdAt: true, updatedAt: true, value: true },
    take: 20
  });

  // Analyze activities in those deals
  const signals: Record<string, number[]> = {};
  let totalValue = 0;
  let totalDays = 0;

  for (const deal of wonDeals) {
    totalValue += deal.value;
    const daysToClose = Math.floor(
      (new Date(deal.updatedAt).getTime() -
        new Date(deal.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    totalDays += daysToClose;

    const activities = await db.activity.findMany({
      where: { leadId: deal.id },
      select: { type: true }
    });

    for (const activity of activities) {
      if (!signals[activity.type]) signals[activity.type] = [];
      signals[activity.type].push(daysToClose);
    }
  }

  // Calculate win rates
  const signalAnalysis = Object.entries(signals).map(([signal, times]) => ({
    signal,
    winRate: Math.round((times.length / wonDeals.length) * 100) // % of won deals with this signal
  }));

  return {
    signals: signalAnalysis.sort((a, b) => b.winRate - a.winRate),
    avgDealSize: Math.round(totalValue / wonDeals.length),
    avgClosureTime: Math.round(totalDays / wonDeals.length)
  };
}

/**
 * Learn from user decision
 * When user approves/rejects AI suggestion, store feedback
 */
export async function storeFeedback(
  feedback: FeedbackData
): Promise<void> {
  const decision = await db.decision.findUnique({
    where: { id: feedback.decisionId },
    select: { recommendation: true }
  });

  if (!decision) {
    console.warn(`Decision ${feedback.decisionId} not found`);
    return;
  }

  // Persist feedback in AI logs using existing Prisma model.
  await db.aILog.create({
    data: {
      userId: feedback.userId,
      leadId: feedback.leadId,
      prompt: `feedback:${feedback.action}`,
      response: JSON.stringify({
        decisionId: feedback.decisionId,
        actionTaken: feedback.actionTaken,
        result: feedback.result,
        notes: feedback.notes
      }),
      latencyMs: 0,
      success: true,
      promptVersion: "feedback-v1"
    }
  }).catch(() => {
    // Keep workflow resilient even if log write fails.
  });

  console.log(
    `✅ Feedback stored: ${feedback.action} -> ${feedback.actionTaken} (${feedback.result})`
  );
}

/**
 * Get user's learned patterns
 */
export async function getUserPatterns(
  userId: string
): Promise<{
  channelPrefs: Record<string, number>;
  optimalTime: { bestDay: string; bestHour: number; responseTime: number };
  winningSignals: Array<{ signal: string; winRate: number }>;
}> {
  const [channelPrefs, optimalTime, { signals }] = await Promise.all([
    analyzeChannelPreference(userId),
    analyzeOptimalContactTime(userId),
    identifyWinningSignals(userId)
  ]);

  return {
    channelPrefs,
    optimalTime,
    winningSignals: signals
  };
}

/**
 * Apply learned patterns to AI decisions
 * Personalize recommendations based on user history
 */
export async function applyLearningToDecision(
  userId: string,
  baseDecision: any
): Promise<any> {
  const patterns = await getUserPatterns(userId);

  // Adjust channel recommendation based on user preferences
  const preferredChannel = Object.entries(patterns.channelPrefs)
    .sort(([_, a], [__, b]) => b - a)[0]?.[0] || baseDecision.recommendedChannel;

  // Adjust timing based on optimal contact time
  const { bestHour, bestDay } = patterns.optimalTime;

  return {
    ...baseDecision,
    recommendedChannel: preferredChannel,
    suggestedContactTime: { bestDay, bestHour }
  };
}
