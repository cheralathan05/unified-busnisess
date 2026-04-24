/**
 * ⏱ TIME-BASED AI INTELLIGENCE JOBS
 * Runs periodically to detect inactivity, generate suggestions, score leads
 * This is the "background brain" of the system
 */

import { db } from "../config/db";
import { runAIWorkflow } from "../modules/ai/ai.workflow";
import { calculateScore } from "../modules/ai/scoring.service";

/**
 * Job 1: Detect Inactive Leads
 * Runs every hour to find stalled opportunities
 */
export async function job_detectInactiveLeads(): Promise<{
  processed: number;
  triggered: number;
}> {
  console.log("⏱ [CRON] Starting inactive lead detection...");
  const start = Date.now();

  try {
    // Find leads with no activity in last 7+ days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const inactiveLeads = await db.lead.findMany({
      where: {
        activities: {
          none: {
            createdAt: { gte: sevenDaysAgo }
          }
        }
      },
      select: { id: true, userId: true }
    });

    console.log(`⏱ Found ${inactiveLeads.length} inactive leads`);

    // Trigger AI analysis for each
    let triggered = 0;
    for (const lead of inactiveLeads.slice(0, 10)) {
      // Limit to 10 per run
      try {
        await runAIWorkflow({
          event: "ai.manual_trigger",
          leadId: lead.id,
          userId: lead.userId,
          metadata: { reason: "inactivity_detection" }
        });
        triggered++;
      } catch (error) {
        console.warn(`Failed to trigger AI for lead ${lead.id}:`, error);
      }
    }

    console.log(`✅ Inactive detection complete: ${triggered} triggered in ${Date.now() - start}ms`);
    return { processed: inactiveLeads.length, triggered };
  } catch (error) {
    console.error("❌ Inactive detection failed:", error);
    return { processed: 0, triggered: 0 };
  }
}

/**
 * Job 2: Rescore All Leads
 * Runs every 2 hours to update lead scores based on recent activity
 */
export async function job_rescoreAllLeads(): Promise<{
  processed: number;
  updated: number;
}> {
  console.log("⏱ [CRON] Starting lead rescoring...");
  const start = Date.now();

  try {
    const leads = await db.lead.findMany({
      select: { id: true }
    });

    let updated = 0;

    for (const lead of leads) {
      try {
        const fullLead = await db.lead.findUnique({
          where: { id: lead.id }
        });

        if (fullLead) {
          const newScore = calculateScore(fullLead);

          if (newScore !== fullLead.score) {
            await db.lead.update({
              where: { id: lead.id },
              data: { score: newScore }
            });
            updated++;
          }
        }
      } catch (error) {
        console.warn(`Failed to rescore lead ${lead.id}:`, error);
      }
    }

    console.log(`✅ Rescoring complete: ${updated}/${leads.length} updated in ${Date.now() - start}ms`);
    return { processed: leads.length, updated };
  } catch (error) {
    console.error("❌ Rescoring failed:", error);
    return { processed: 0, updated: 0 };
  }
}

/**
 * Job 3: Generate Suggestions for High-Value Deals
 * Runs every 3 hours for deals over $50k
 */
export async function job_suggestHighValueDeals(): Promise<{
  processed: number;
  suggested: number;
}> {
  console.log("⏱ [CRON] Starting high-value suggestion generation...");
  const start = Date.now();

  try {
    const highValueLeads = await db.lead.findMany({
      where: {
        value: { gte: 50000 },
        stage: { not: "Closed" }
      },
      select: { id: true, userId: true, score: true }
    });

    console.log(`⏱ Found ${highValueLeads.length} high-value opportunities`);

    let suggested = 0;
    for (const lead of highValueLeads.slice(0, 20)) {
      // Limit to 20
      try {
        await runAIWorkflow({
          event: "ai.manual_trigger",
          leadId: lead.id,
          userId: lead.userId,
          metadata: { reason: "high_value_review", value: 50000 }
        });
        suggested++;
      } catch (error) {
        console.warn(`Failed to generate suggestion for ${lead.id}:`, error);
      }
    }

    console.log(`✅ High-value suggestions complete: ${suggested} in ${Date.now() - start}ms`);
    return { processed: highValueLeads.length, suggested };
  } catch (error) {
    console.error("❌ High-value suggestions failed:", error);
    return { processed: 0, suggested: 0 };
  }
}

/**
 * Job 4: Escalate Critical Deals
 * Runs every hour fordeals at critical risk
 */
export async function job_escalateCriticalDeals(): Promise<{
  processed: number;
  escalated: number;
}> {
  console.log("⏱ [CRON] Starting critical deal escalation check...");
  const start = Date.now();

  try {
    const criticalLeads = await db.lead.findMany({
      where: {
        AND: [{ value: { gte: 50000 } }, { score: { lt: 30 } }, { stage: { not: "Closed" } }]
      },
      select: { id: true, userId: true, company: true, value: true }
    });

    console.log(`⏱ Found ${criticalLeads.length} critical deals`);

    // Create escalation notifications
    let escalated = 0;
    for (const lead of criticalLeads) {
      try {
        // Persist escalation as lead activity.
        await db.activity.create({
          data: {
            userId: lead.userId,
            leadId: lead.id,
            type: "deal.at_risk",
            text: `CRITICAL escalation: ${lead.company} ($${lead.value}) dropped below acceptable risk threshold`,
            status: "pending"
          }
        }).catch(() => {
          // Keep cron resilient if activity insert fails.
        });

        escalated++;
      } catch (error) {
        console.warn(`Failed to escalate ${lead.id}:`, error);
      }
    }

    console.log(`✅ Escalation check complete: ${escalated} escalated in ${Date.now() - start}ms`);
    return { processed: criticalLeads.length, escalated };
  } catch (error) {
    console.error("❌ Escalation check failed:", error);
    return { processed: 0, escalated: 0 };
  }
}

/**
 * Job 5: Cleanup Stale Suggestions
 * Runs daily to archive old suggestions
 */
export async function job_cleanupStaleSuggestions(): Promise<{
  archived: number;
}> {
  console.log("⏱ [CRON] Cleaning up stale suggestions...");
  const start = Date.now();

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Archive old pending suggestions
    const result = await db.decision.updateMany({
      where: {
        AND: [{ status: "suggested" }, { createdAt: { lt: thirtyDaysAgo } }]
      },
      data: { status: "expired" as any }
    });

    console.log(`✅ Cleanup complete: ${result.count} suggestions archived in ${Date.now() - start}ms`);
    return { archived: result.count };
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    return { archived: 0 };
  }
}

/**
 * Register all cron jobs with schedule
 * Call this in app.ts during initialization
 */
export function registerAICronJobs(): void {
  console.log("⏱ Registering AI background jobs...");

  // Every hour: Detect inactive leads
  setInterval(job_detectInactiveLeads, 60 * 60 * 1000);

  // Every 2 hours: Rescore leads
  setInterval(job_rescoreAllLeads, 2 * 60 * 60 * 1000);

  // Every 3 hours: Suggest high-value deals
  setInterval(job_suggestHighValueDeals, 3 * 60 * 60 * 1000);

  // Every hour: Escalate critical
  setInterval(job_escalateCriticalDeals, 60 * 60 * 1000);

  // Every day: Cleanup stale
  setInterval(job_cleanupStaleSuggestions, 24 * 60 * 60 * 1000);

  console.log("✅ AI cron jobs registered");
}

/**
 * For testing: Run all jobs immediately
 */
export async function runAllAIJobsNow(): Promise<void> {
  console.log("\n🔄 Running all AI jobs immediately (testing)...\n");

  const results = await Promise.all([
    job_detectInactiveLeads(),
    job_rescoreAllLeads(),
    job_suggestHighValueDeals(),
    job_escalateCriticalDeals(),
    job_cleanupStaleSuggestions()
  ]);

  console.log("\n📊 Job Results:");
  console.log("1. Inactive Detection:", results[0]);
  console.log("2. Rescoring:", results[1]);
  console.log("3. High-Value Suggestions:", results[2]);
  console.log("4. Escalation:", results[3]);
  console.log("5. Cleanup:", results[4]);
}
