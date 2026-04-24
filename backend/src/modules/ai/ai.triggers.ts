/**
 * 🔥 EVENT-DRIVEN AI TRIGGERS
 * AI is never called directly - always triggered by events
 * Creates the nervous system of the AI orchestration
 */

import { eventBus } from "../../core/events/eventBus";
import { runAIWorkflow } from "./ai.workflow";

/**
 * Event types that trigger AI
 */
export type AITriggerEvent =
  | "lead.created"
  | "lead.updated"
  | "activity.created"
  | "payment.received"
  | "schedule.created"
  | "ai.manual_trigger";

export interface AITriggerPayload {
  event: AITriggerEvent;
  leadId: string;
  userId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Register all AI trigger listeners
 * Call this once in application startup (app.ts)
 */
export function registerAITriggers(): void {
  console.log("🔥 Registering AI trigger listeners...");

  // Trigger 1: New lead created
  eventBus.on("lead.created", async (payload: { id: string; userId: string }) => {
    console.log(`🔔 Trigger: LEAD_CREATED #${payload.id}`);
    await runAIWorkflow({
      event: "lead.created",
      leadId: payload.id,
      userId: payload.userId,
      metadata: { timestamp: new Date() }
    });
  });

  // Trigger 2: Lead updated (stage/value change)
  eventBus.on("lead.updated", async (payload: { id: string; userId: string; changes?: Record<string, unknown> }) => {
    // Only trigger AI if important fields changed
    const importantFields = ["stage", "value", "score"];
    const changed = Object.keys(payload.changes || {}).some((k) =>
      importantFields.includes(k)
    );

    if (!changed) return;

    console.log(`🔔 Trigger: LEAD_UPDATED #${payload.id}`);
    await runAIWorkflow({
      event: "lead.updated",
      leadId: payload.id,
      userId: payload.userId,
      metadata: { changes: payload.changes }
    });
  });

  // Trigger 3: Activity created (engagement signal)
  eventBus.on("activity.created", async (payload: { id: string; leadId: string; userId: string }) => {
    console.log(`🔔 Trigger: ACTIVITY_CREATED #${payload.id}`);
    await runAIWorkflow({
      event: "activity.created",
      leadId: payload.leadId,
      userId: payload.userId,
      metadata: { activityId: payload.id }
    });
  });

  // Trigger 4: Payment received (revenue signal)
  eventBus.on("payment.received", async (payload: { id: string; leadId: string; userId: string; amount: number }) => {
    console.log(`🔔 Trigger: PAYMENT_RECEIVED #${payload.id} ($${payload.amount})`);
    await runAIWorkflow({
      event: "payment.received",
      leadId: payload.leadId,
      userId: payload.userId,
      metadata: { paymentId: payload.id, amount: payload.amount }
    });
  });

  // Trigger 5: Schedule created (intent signal)
  eventBus.on("schedule.created", async (payload: { id: string; leadId: string; userId: string }) => {
    console.log(`🔔 Trigger: SCHEDULE_CREATED #${payload.id}`);
    await runAIWorkflow({
      event: "schedule.created",
      leadId: payload.leadId,
      userId: payload.userId,
      metadata: { scheduleId: payload.id }
    });
  });

  console.log("✅ AI triggers registered");
}

/**
 * Manually trigger AI workflow
 * For testing or programmatic triggers
 */
export async function triggerAIWorkflow(
  leadId: string,
  userId: string,
  eventType: AITriggerEvent = "ai.manual_trigger"
): Promise<void> {
  console.log(`🎯 Manual AI trigger: ${eventType} for lead ${leadId}`);
  await runAIWorkflow({
    event: eventType,
    leadId,
    userId
  });
}

/**
 * Emit synthetic event (for testing)
 */
export function emitAITriggerEvent(
  event: AITriggerEvent,
  leadId: string,
  userId: string
): void {
  eventBus.emit(event as any, { id: leadId, userId, leadId });
}
