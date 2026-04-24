/**
 * 🧠 SIGNAL DETECTION ENGINE
 * Extracts derived intelligence from raw data
 * This is what makes AI decisions "smart"
 */

import { db } from "../../config/db";
import { AIContext } from "./ai.context";

export interface AISignals {
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  dealHealth: "EXCELLENT" | "HEALTHY" | "AT_RISK" | "STALLED";
  engagementScore: number; // 0-100
  closeProbability: number; // 0-100
  lastActivityGap: number; // days
  inactivityThreshold: number; // days before "stalled"
  dealVelocity: "FAST" | "NORMAL" | "SLOW" | "STUCK";
  valueAtRisk: number; // $ amount if lost
  decayRate: number; // 0-1, how much score drops daily
}

/**
 * Calculate time gap since last activity (in days)
 */
function calculateActivityGap(lastActivity?: Date): number {
  if (!lastActivity) return 999;
  const now = new Date();
  const gapMs = now.getTime() - new Date(lastActivity).getTime();
  return Math.floor(gapMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate engagement score from activity patterns
 * - Frequency: How often does user interact?
 * - Recency: How recent was last interaction?
 * - Diversity: Different activity types?
 */
function calculateEngagementScore(
  activities: AIContext["activities"],
  lastActivityGap: number
): number {
  let score = 50; // Base

  // Recency bonus
  if (lastActivityGap === 0) score += 25;
  else if (lastActivityGap <= 1) score += 20;
  else if (lastActivityGap <= 3) score += 10;
  else if (lastActivityGap <= 7) score += 5;
  else score -= Math.min(lastActivityGap * 2, 30); // Decay

  // Frequency bonus
  const activityCount = activities.length;
  if (activityCount > 10) score += 15;
  else if (activityCount > 5) score += 10;
  else if (activityCount > 0) score += 5;

  // Diversity bonus
  const uniqueTypes = new Set(activities.map((a) => a.type)).size;
  if (uniqueTypes > 3) score += 10;
  else if (uniqueTypes > 1) score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Detect deal velocity: how fast is this moving?
 */
function detectDealVelocity(
  activities: AIContext["activities"],
  payments: AIContext["payments"],
  lastActivityGap: number
): "FAST" | "NORMAL" | "SLOW" | "STUCK" {
  const recentActivities = activities.filter((a) => {
    const gap = calculateActivityGap(a.createdAt);
    return gap <= 7;
  }).length;

  const recentPayments = payments.filter((p) => {
    const gap = calculateActivityGap(p.createdAt);
    return gap <= 14;
  }).length;

  if (recentActivities > 5 || recentPayments > 0) return "FAST";
  if (lastActivityGap <= 3 && recentActivities > 2) return "NORMAL";
  if (lastActivityGap <= 14) return "SLOW";
  return "STUCK";
}

/**
 * Assess deal health based on multiple factors
 */
function assessDealHealth(
  score: number,
  lastActivityGap: number,
  dealVelocity: string,
  payments: AIContext["payments"]
): "EXCELLENT" | "HEALTHY" | "AT_RISK" | "STALLED" {
  // EXCELLENT: High score, recent activity, paid
  if (score > 80 && lastActivityGap <= 2 && payments.some((p) => p.status === "completed")) {
    return "EXCELLENT";
  }

  // HEALTHY: Good score, consistent activity
  if (score > 60 && lastActivityGap <= 5 && dealVelocity === "NORMAL") {
    return "HEALTHY";
  }

  // AT_RISK: Declining engagement or score
  if ((score < 60 && lastActivityGap > 3) || (lastActivityGap > 7 && lastActivityGap < 14)) {
    return "AT_RISK";
  }

  // STALLED: No activity, low score
  if (lastActivityGap > 14 || score < 30) {
    return "STALLED";
  }

  return "HEALTHY";
}

/**
 * Calculate urgency level
 */
function calculateUrgency(
  dealHealth: string,
  lastActivityGap: number,
  dealVelocity: string,
  value: number
): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  // CRITICAL: High value at risk
  if (dealHealth === "STALLED" && value > 50000) return "CRITICAL";
  if (dealHealth === "AT_RISK" && lastActivityGap > 10) return "CRITICAL";

  // HIGH: At risk but moderate value
  if (dealHealth === "AT_RISK" || (lastActivityGap > 7 && dealVelocity === "STUCK")) {
    return "HIGH";
  }

  // MEDIUM: Needs attention soon
  if (lastActivityGap > 3 || dealVelocity === "SLOW") return "MEDIUM";

  // LOW: Healthy, moving forward
  return "LOW";
}

/**
 * Extract all signals from context
 */
export async function extractSignals(
  context: AIContext,
  score: number
): Promise<AISignals> {
  const lastActivityGap = calculateActivityGap(
    context.activities[0]?.createdAt
  );
  const engagementScore = calculateEngagementScore(context.activities, lastActivityGap);
  const dealVelocity = detectDealVelocity(
    context.activities,
    context.payments,
    lastActivityGap
  );
  const dealHealth = assessDealHealth(
    score,
    lastActivityGap,
    dealVelocity,
    context.payments
  );
  const urgency = calculateUrgency(
    dealHealth,
    lastActivityGap,
    dealVelocity,
    context.lead.value
  );

  // Close probability (0-100)
  const closeProbability = Math.round(
    (score * 0.4 +
      engagementScore * 0.4 +
      (100 - Math.min(lastActivityGap * 5, 100)) * 0.2) /
      3
  );

  // Decay rate: How much score drops per day of inactivity
  const decayRate = 0.02 + (dealHealth === "STALLED" ? 0.05 : 0);

  return {
    urgency,
    dealHealth,
    engagementScore,
    closeProbability,
    lastActivityGap,
    inactivityThreshold: dealHealth === "STALLED" ? 14 : 21,
    dealVelocity,
    valueAtRisk: context.lead.value,
    decayRate
  };
}
