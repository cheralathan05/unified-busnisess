import { db } from "../../config/db";
import { EVENTS } from "../../constants/event.constants";
import { eventBus } from "../../core/events/eventBus";
import { runAI } from "../../modules/ai/ai.orchestrator";
import { addNotificationJob } from "../../queues/notification.queue";
import { aiService } from "../../modules/ai/ai.service";

const SCORE_BONUS = {
  EMAIL_OPENED: 4,
  EMAIL_REPLIED: 10,
  WHATSAPP_REPLIED: 8,
  MEETING_SCHEDULED: 6,
  MEETING_COMPLETED: 12,
  MEETING_MISSED: -6
} as const;

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

async function updateLeadStage(leadId: string, stage: string) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.stage === stage) return lead;

  const updated = await db.lead.update({
    where: { id: leadId },
    data: { stage }
  });

  eventBus.emit(EVENTS.LEAD_UPDATED, {
    ...updated,
    changes: { stage }
  });

  await createSystemActivity(updated.userId, leadId, "stage.changed", `Stage moved to ${stage}`);
  return updated;
}

async function createSystemActivity(userId: string, leadId: string, type: string, text: string) {
  if (!userId || !leadId) return;

  const activity = await db.activity.create({
    data: {
      userId,
      leadId,
      type,
      text
    }
  });

  eventBus.emit(EVENTS.ACTIVITY_CREATED, activity);
}

async function applyScoreDelta(leadId: string, delta: number, reason: string) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  const score = clampScore(Number(lead.score || 0) + delta);
  await db.lead.update({
    where: { id: leadId },
    data: { score }
  });

  await createSystemActivity(lead.userId, lead.id, "score.adjusted", `${reason}. Score is now ${score}`);

  eventBus.emit(EVENTS.AI_RECALCULATION_REQUESTED, {
    leadId,
    userId: lead.userId,
    reason
  });
}

async function runAIRecalculation(leadId: string, userId: string, reason: string) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  try {
    const ai = await runAI(lead);

    const updated = await db.lead.update({
      where: { id: leadId },
      data: {
        score: ai.score,
        summary: ai.summary,
        insights: ai.insights,
        nextAction: ai.nextAction,
        confidence: ai.confidence,
        priority: ai.priority,
        promptVersion: ai.promptVersion
      }
    });

    eventBus.emit(EVENTS.AI_PROCESSED, {
      leadId,
      userId,
      reason,
      score: ai.score,
      probability: ai.probability,
      riskLevel: ai.priority,
      nextAction: ai.nextAction
    });

    eventBus.emit(EVENTS.LEAD_UPDATED, {
      ...updated,
      changes: {
        score: ai.score,
        nextAction: ai.nextAction,
        confidence: ai.confidence
      }
    });

    eventBus.emit(EVENTS.DASHBOARD_REFRESH_REQUESTED, {
      userId,
      leadId,
      reason: `ai:${reason}`
    });
  } catch (error: any) {
    eventBus.emit(EVENTS.AI_FAILED, {
      leadId,
      userId,
      reason,
      error: error?.message || "unknown"
    });
  }
}

function queueSystemNotification(
  userId: string,
  type: "EMAIL" | "SMS" | "IN_APP",
  payload: any,
  delayMs?: number
) {
  void addNotificationJob({ type, payload: { userId, ...payload }, delayMs });
}

eventBus.on(EVENTS.PAYMENT_PARTIAL, async (payment: any) => {
  if (!payment?.leadId) return;
  await updateLeadStage(payment.leadId, "Negotiation");
  eventBus.emit(EVENTS.DASHBOARD_REFRESH_REQUESTED, { userId: payment.userId, leadId: payment.leadId, reason: "payment.partial" });
  eventBus.emit(EVENTS.AI_RECALCULATION_REQUESTED, { leadId: payment.leadId, userId: payment.userId, reason: "payment.partial" });
  queueSystemNotification(payment.userId, "IN_APP", {
    title: "Partial payment received",
    message: `Received ${payment.amount}. Lead moved to Negotiation.`
  });
});

eventBus.on(EVENTS.PAYMENT_SUCCESS, async (payment: any) => {
  if (!payment?.leadId) return;
  await updateLeadStage(payment.leadId, "Closed Won");
  eventBus.emit(EVENTS.DASHBOARD_REFRESH_REQUESTED, { userId: payment.userId, leadId: payment.leadId, reason: "payment.success" });
  eventBus.emit(EVENTS.AI_RECALCULATION_REQUESTED, { leadId: payment.leadId, userId: payment.userId, reason: "payment.success" });
  queueSystemNotification(payment.userId, "IN_APP", {
    title: "Payment successful",
    message: `Payment ${payment.id} completed for ${payment.amount}.`
  });
});

eventBus.on(EVENTS.PAYMENT_FAILED, async (payment: any) => {
  if (!payment?.leadId) return;
  await updateLeadStage(payment.leadId, "Closed Lost");
  eventBus.emit(EVENTS.DASHBOARD_REFRESH_REQUESTED, { userId: payment.userId, leadId: payment.leadId, reason: "payment.failed" });
  eventBus.emit(EVENTS.AI_RECALCULATION_REQUESTED, { leadId: payment.leadId, userId: payment.userId, reason: "payment.failed" });
  queueSystemNotification(payment.userId, "IN_APP", {
    title: "Payment failed",
    message: `Payment ${payment.id} failed and lead moved to Closed Lost.`
  });
});

eventBus.on(EVENTS.INVOICE_CREATED, async (invoice: any) => {
  if (!invoice?.leadId) return;
  const lead = await updateLeadStage(invoice.leadId, "Proposal");
  eventBus.emit(EVENTS.DASHBOARD_REFRESH_REQUESTED, {
    userId: lead?.userId,
    leadId: invoice.leadId,
    reason: "invoice.created"
  });
  queueSystemNotification(lead?.userId || "", "IN_APP", {
    title: "Invoice created",
    message: `Invoice ${invoice.id} created with status ${invoice.status}.`
  });
});

eventBus.on(EVENTS.EMAIL_SENT, async (payload: any) => {
  if (!payload?.leadId || !payload?.userId) return;

  await createSystemActivity(payload.userId, payload.leadId, "email.sent", `Email sent to ${payload.to || "lead"}`);

  queueSystemNotification(
    payload.userId,
    "IN_APP",
    {
      title: "Follow-up needed",
      message: `No reply after 48h for lead ${payload.leadId}. Triggering follow-up.`
    },
    48 * 60 * 60 * 1000
  );
});

eventBus.on(EVENTS.EMAIL_OPENED, async (payload: any) => {
  if (!payload?.leadId) return;
  await applyScoreDelta(payload.leadId, SCORE_BONUS.EMAIL_OPENED, "Email opened");
});

eventBus.on(EVENTS.EMAIL_REPLIED, async (payload: any) => {
  if (!payload?.leadId) return;
  await applyScoreDelta(payload.leadId, SCORE_BONUS.EMAIL_REPLIED, "Email replied");
});

eventBus.on(EVENTS.WHATSAPP_REPLIED, async (payload: any) => {
  if (!payload?.leadId) return;
  await applyScoreDelta(payload.leadId, SCORE_BONUS.WHATSAPP_REPLIED, "WhatsApp replied");
});

eventBus.on(EVENTS.MEETING_SCHEDULED, async (payload: any) => {
  if (!payload?.leadId || !payload?.userId) return;
  await applyScoreDelta(payload.leadId, SCORE_BONUS.MEETING_SCHEDULED, "Meeting scheduled");
});

eventBus.on(EVENTS.MEETING_COMPLETED, async (payload: any) => {
  if (!payload?.leadId) return;
  await applyScoreDelta(payload.leadId, SCORE_BONUS.MEETING_COMPLETED, "Meeting completed");
});

eventBus.on(EVENTS.MEETING_MISSED, async (payload: any) => {
  if (!payload?.leadId) return;
  await applyScoreDelta(payload.leadId, SCORE_BONUS.MEETING_MISSED, "Meeting missed");
  eventBus.emit(EVENTS.NOTIFICATION_REQUESTED, {
    userId: payload.userId,
    channel: "IN_APP",
    message: `Meeting missed for lead ${payload.leadId}. Follow-up suggested.`
  });
});

eventBus.on(EVENTS.LEAD_INACTIVE, async (payload: any) => {
  if (!payload?.leadId) return;
  await createSystemActivity(payload.userId, payload.leadId, "lead.inactive", "Lead inactive for configured threshold");
  eventBus.emit(EVENTS.AI_RECALCULATION_REQUESTED, {
    leadId: payload.leadId,
    userId: payload.userId,
    reason: "lead.inactive"
  });
  eventBus.emit(EVENTS.NOTIFICATION_REQUESTED, {
    userId: payload.userId,
    channel: "IN_APP",
    message: `Lead ${payload.leadId} inactive. Re-engagement flow triggered.`
  });
});

eventBus.on(EVENTS.AI_RECALCULATION_REQUESTED, async (payload: any) => {
  if (!payload?.leadId || !payload?.userId) return;
  await runAIRecalculation(payload.leadId, payload.userId, payload.reason || "system.event");
});

eventBus.on(EVENTS.NOTIFICATION_REQUESTED, (payload: any) => {
  if (!payload?.userId) return;
  const channel = String(payload.channel || "IN_APP").toUpperCase();
  const type = channel === "EMAIL" ? "EMAIL" : channel === "SMS" ? "SMS" : "IN_APP";

  queueSystemNotification(payload.userId, type, {
    title: payload.title || "CRM Notification",
    message: payload.message || "System event notification",
    meta: payload.meta || {}
  });
});

eventBus.on(EVENTS.DASHBOARD_REFRESH_REQUESTED, (payload: any) => {
  eventBus.emit(EVENTS.DASHBOARD_UPDATED, {
    userId: payload?.userId,
    leadId: payload?.leadId,
    reason: payload?.reason || "system"
  });
});

eventBus.on(EVENTS.PAYMENT_VERIFICATION_COMPLETED, async (payload: any) => {
  if (!payload?.leadId || !payload?.userId) return;

  await createSystemActivity(
    payload.userId,
    payload.leadId,
    "payment.verification.completed",
    `Payment verification ${payload.verificationStatus} (amountMatch=${payload?.validation?.amountMatches})`
  );

  eventBus.emit(EVENTS.DASHBOARD_REFRESH_REQUESTED, {
    userId: payload.userId,
    leadId: payload.leadId,
    reason: "payment.verification.completed"
  });

  queueSystemNotification(payload.userId, "IN_APP", {
    title: "Payment verification updated",
    message: `Payment proof is ${payload.verificationStatus}. Remaining balance: ${payload.remainingBalance || 0}`
  });
});

eventBus.on(EVENTS.LEAD_UPDATED, async (payload: any) => {
  if (!payload?.id || !payload?.userId) return;
  if (payload?.source === "ai") return;

  eventBus.emit(EVENTS.AI_RECALCULATION_REQUESTED, {
    leadId: payload.id,
    userId: payload.userId,
    reason: "lead.updated"
  });
});

eventBus.on(EVENTS.EMAIL_REPLIED, async (payload: any) => {
  if (!payload?.leadId || !payload?.userId || !payload?.text) return;

  const sentiment = await aiService.analyzeSentiment(String(payload.text));
  await createSystemActivity(
    payload.userId,
    payload.leadId,
    "email.sentiment.analyzed",
    `Sentiment=${sentiment.sentiment}, intent=${sentiment.intent}, engagement=${sentiment.engagementScore}`
  );
});

eventBus.on(EVENTS.WHATSAPP_REPLIED, async (payload: any) => {
  if (!payload?.leadId || !payload?.userId || !payload?.text) return;

  const sentiment = await aiService.analyzeSentiment(String(payload.text));
  await createSystemActivity(
    payload.userId,
    payload.leadId,
    "whatsapp.sentiment.analyzed",
    `Sentiment=${sentiment.sentiment}, intent=${sentiment.intent}, engagement=${sentiment.engagementScore}`
  );
});
