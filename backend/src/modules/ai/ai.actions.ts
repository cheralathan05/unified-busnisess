import { db } from "../../config/db";
import { Prisma } from "@prisma/client";
import { EmailService } from "../communication/email.service";
import { CalendarService } from "../communication/calendar.service";
import { eventBus } from "../../core/events/eventBus";

const emailService = new EmailService();
const calendarService = new CalendarService();

interface DecisionLike {
  id: string;
  userId: string;
  leadId: string;
  type: string;
  status: "suggested" | "approved" | "rejected" | "executed";
  recommendation: unknown;
}

export async function executeAction(decision: DecisionLike) {
  const normalizedStatus = String(decision.status || "").toLowerCase();
  if (normalizedStatus !== "approved" && normalizedStatus !== "executed") {
    return { skipped: true, reason: "Decision is not approved" };
  }

  let actionType = "task";
  let payload: Record<string, unknown> = { decisionId: decision.id };

  if (decision.type === "email_followup") {
    actionType = "email";

    const lead = await db.lead.findUnique({
      where: { id: decision.leadId },
      select: { email: true, company: true, userId: true }
    });

    if (lead?.email) {
      await emailService.send({
        to: lead.email,
        subject: `Follow-up regarding ${lead.company}`,
        text: "Checking in to continue our discussion.",
        userId: lead.userId
      });
    }

    payload = { leadId: decision.leadId, channel: "email" };
  } else if (decision.type === "call_schedule") {
    actionType = "call";

    const lead = await db.lead.findUnique({
      where: { id: decision.leadId },
      select: { email: true }
    });

    const user = await db.user.findUnique({
      where: { id: decision.userId },
      select: { email: true }
    });

    const participants = [lead?.email, user?.email].filter(
      (value): value is string => Boolean(value)
    );

    await calendarService.schedule({
      time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      participants,
      title: "Follow-up call",
      description: "AI suggested follow-up call",
      userId: decision.userId
    });

    payload = { leadId: decision.leadId, channel: "call" };
  } else {
    actionType = "task";
    payload = { leadId: decision.leadId, taskType: "manual_followup" };
    eventBus.emit("task.created", payload);
  }

  const action = await db.action.create({
    data: {
      decisionId: decision.id,
      type: actionType,
      payload: payload as Prisma.InputJsonValue,
      status: "done"
    }
  });

  await db.decision.update({
    where: { id: decision.id },
    data: { status: "executed" }
  });

  await db.activity.create({
    data: {
      type: `brain.${actionType}`,
      text: `Executed ${actionType} action from decision ${decision.id}`,
      leadId: decision.leadId,
      userId: decision.userId
    }
  });

  return action;
}
