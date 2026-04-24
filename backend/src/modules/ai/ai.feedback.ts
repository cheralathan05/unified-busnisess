/**
 * 🔄 AI FEEDBACK & LEARNING LOOP
 * Integrates with Brain module to learn from user decisions
 * When user approves/rejects AI suggestion -> system learns
 */

import { db } from "../../config/db";
import { storeFeedback, applyLearningToDecision } from "./ai.memory";

/**
 * Handle user approving an AI suggestion
 * This decision is now "good" - system learns from it
 */
export async function handleSuggestionApproved(
  decisionId: string,
  userId: string,
  leadId: string
): Promise<void> {
  console.log(`✅ User approved decision: ${decisionId}`);

  try {
    const decision = await db.decision.findUnique({
      where: { id: decisionId },
      select: { type: true, recommendation: true }
    });

    if (!decision) throw new Error(`Decision ${decisionId} not found`);

    // Store feedback as positive
    await storeFeedback({
      decisionId,
      userId,
      leadId,
      action: decision.type,
      actionTaken: "APPROVED",
      result: "POSITIVE"
    });

    // Update decision status
    await db.decision.update({
      where: { id: decisionId },
      data: { status: "approved" }
    });

    console.log(`📚 Learned: User trusts "${decision.type}" recommendations`);
  } catch (error) {
    console.error("❌ Failed to process approval:", error);
  }
}

/**
 * Handle user rejecting an AI suggestion
 * This decision was "wrong" - system learns to avoid it
 */
export async function handleSuggestionRejected(
  decisionId: string,
  userId: string,
  leadId: string,
  reason?: string
): Promise<void> {
  console.log(`❌ User rejected decision: ${decisionId}`);

  try {
    const decision = await db.decision.findUnique({
      where: { id: decisionId },
      select: { type: true, recommendation: true }
    });

    if (!decision) throw new Error(`Decision ${decisionId} not found`);

    // Store feedback as negative
    await storeFeedback({
      decisionId,
      userId,
      leadId,
      action: decision.type,
      actionTaken: "REJECTED",
      result: "NEGATIVE",
      notes: reason
    });

    // Update decision status
    await db.decision.update({
      where: { id: decisionId },
      data: { status: "rejected" }
    });

    console.log(`📚 Learned: User dislikes "${decision.type}" - reason: ${reason || "not specified"}`);
  } catch (error) {
    console.error("❌ Failed to process rejection:", error);
  }
}

/**
 * Handle decision modified before execution
 * User customized the AI suggestion before accepting
 */
export async function handleSuggestionModified(
  decisionId: string,
  userId: string,
  leadId: string,
  modifications: Record<string, unknown>
): Promise<void> {
  console.log(`🔧 User modified decision: ${decisionId}`);

  try {
    const decision = await db.decision.findUnique({
      where: { id: decisionId }
    });

    if (!decision) throw new Error(`Decision ${decisionId} not found`);

    // Store feedback
    await storeFeedback({
      decisionId,
      userId,
      leadId,
      action: decision.type,
      actionTaken: "MODIFIED",
      result: "NEUTRAL",
      notes: `Modified: ${JSON.stringify(modifications)}`
    });

    // Don't fully reject, but note that AI needed adjustment
    console.log(`📚 Learned: AI suggestion was close but needed tweaking`);
  } catch (error) {
    console.error("❌ Failed to process modification:", error);
  }
}

/**
 * Get decision effectiveness metrics
 */
export async function getDecisionMetrics(userId: string): Promise<{
  totalSuggestions: number;
  approved: number;
  rejected: number;
  modified: number;
  approvalRate: number; // 0-100
  rejectionRate: number;
}> {
  const decisions = await db.decision.findMany({
    where: { userId },
    select: { status: true }
  });

  const totalSuggestions = decisions.length;
  const approved = decisions.filter((d) => d.status === "approved").length;
  const rejected = decisions.filter((d) => d.status === "rejected").length;

  return {
    totalSuggestions,
    approved,
    rejected,
    modified: 0, // Would need separate tracking
    approvalRate: totalSuggestions > 0 ? Math.round((approved / totalSuggestions) * 100) : 0,
    rejectionRate:
      totalSuggestions > 0 ? Math.round((rejected / totalSuggestions) * 100) : 0
  };
}

/**
 * Most trusted suggestion types for a user
 */
export async function getTrustedDecisionTypes(
  userId: string
): Promise<Array<{ type: string; trustScore: number }>> {
  const decisions = await db.decision.findMany({
    where: { userId, status: "approved" },
    select: { type: true }
  });

  const typeMap: Record<string, number> = {};

  for (const decision of decisions) {
    typeMap[decision.type] = (typeMap[decision.type] || 0) + 1;
  }

  const types = Object.entries(typeMap)
    .map(([type, count]) => ({
      type,
      trustScore: count
    }))
    .sort((a, b) => b.trustScore - a.trustScore);

  return types;
}

/**
 * Low-trust decision types (frequently rejected)
 */
export async function getLowTrustDecisionTypes(
  userId: string
): Promise<Array<{ type: string; rejectionRate: number }>> {
  const decisions = await db.decision.findMany({
    where: { userId },
    select: { type: true, status: true }
  });

  const typeStats: Record<string, { total: number; rejected: number }> = {};

  for (const decision of decisions) {
    if (!typeStats[decision.type]) {
      typeStats[decision.type] = { total: 0, rejected: 0 };
    }
    typeStats[decision.type].total++;
    if (decision.status === "rejected") {
      typeStats[decision.type].rejected++;
    }
  }

  const lowTrust = Object.entries(typeStats)
    .map(([type, stats]) => ({
      type,
      rejectionRate: stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0
    }))
    .filter((t) => t.rejectionRate > 50)
    .sort((a, b) => b.rejectionRate - a.rejectionRate);

  return lowTrust;
}

/**
 * Auto-learn: Suppress low-trust decision types
 * If user rejects "email_followup" 70% of the time, deprioritize it
 */
export async function autoSuppressLowTrustTypes(
  userId: string
): Promise<string[]> {
  const lowTrust = await getLowTrustDecisionTypes(userId);
  const suppressedTypes = lowTrust
    .filter((t) => t.rejectionRate >= 70)
    .map((t) => t.type);

  if (suppressedTypes.length > 0) {
    console.log(`🚫 Auto-suppressed for user: ${suppressedTypes.join(", ")}`);
  }

  return suppressedTypes;
}
