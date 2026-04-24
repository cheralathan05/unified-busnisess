import { Request, Response } from "express";
import { EmailService } from "./email.service";
import { WhatsAppService } from "./whatsapp.service";
import { CalendarService } from "./calendar.service";
import { eventBus } from "../../core/events/eventBus";
import { EVENTS } from "../../constants/event.constants";
import { aiService } from "../ai/ai.service";
import { buildAIFollowupEmailPrompt } from "../ai/ai.prompts";
import { db } from "../../config/db";
import { addMeetingJob } from "../../queues/meeting.queue";

const emailService = new EmailService();
const whatsappService = new WhatsAppService();
const calendarService = new CalendarService();

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizeParticipants(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return undefined;
  return normalized;
}

function uniqueEmails(values: Array<string | undefined>): string[] {
  const deduped = new Set<string>();

  for (const value of values) {
    const email = normalizeEmail(value);
    if (email) deduped.add(email);
  }

  return Array.from(deduped);
}

async function resolveAdminNotificationEmails() {
  const envAdmins = String(process.env.ADMIN_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter((item): item is string => Boolean(item));

  const adminUsers = await db.user.findMany({
    where: {
      deletedAt: null,
      role: {
        in: ["ADMIN", "SUPER_ADMIN", "admin", "super_admin"]
      }
    },
    select: {
      email: true
    }
  }).catch(() => []);

  const dbAdmins = adminUsers
    .map((user) => normalizeEmail(user.email))
    .filter((item): item is string => Boolean(item));

  return uniqueEmails([...envAdmins, ...dbAdmins]);
}

function isFallbackAIText(text: string) {
  if (!text) return true;
  return (
    text.includes("\"summary\":\"AI unavailable\"") ||
    text.toLowerCase().includes("ai timeout") ||
    text.includes("\"nextAction\":\"wait\"") ||
    text.trim() === "AI unavailable"
  );
}

function buildFallbackWhatsApp(lead: any, context?: string) {
  const name = String(lead?.name || "there");
  const company = String(lead?.company || "your project");
  const stage = String(lead?.stage || "current stage");
  const ctx = String(context || lead?.lastActivity || "our last discussion");
  return `Hi ${name}, quick follow-up on ${company}. Based on ${ctx}, we can finalize next steps for ${stage} today. Would 4 PM or 6 PM work for a short call?`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function stripJsonWrapperIfNeeded(text: string): string {
  const trimmed = String(text || "").trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const maybeJson = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(maybeJson);
      if (typeof parsed?.email === "string") return parsed.email.trim();
      if (typeof parsed?.body === "string") return parsed.body.trim();
      if (typeof parsed?.text === "string") return parsed.text.trim();
    } catch {
      // Fall through and use raw text.
    }
  }
  return trimmed;
}

function isLowQualityEmail(text: string): boolean {
  const normalized = String(text || "").trim();
  if (!normalized) return true;

  const words = normalized.split(/\s+/).filter(Boolean).length;
  if (words < 70) return true;

  const genericPatterns = [
    "i wanted to follow up regarding",
    "if helpful, i can share",
    "would you be open to a quick",
  ];

  const lower = normalized.toLowerCase();
  const genericHits = genericPatterns.filter((p) => lower.includes(p)).length;
  return genericHits >= 2;
}

function buildFallbackEmail(lead: any) {
  const contactName = lead?.name || "there";
  const company = lead?.company || "your company";
  const stage = lead?.stage || "current stage";
  const value = Number(lead?.value || 0);
  const valueText = value > 0 ? `$${value.toLocaleString()}` : "this opportunity";
  const score = Number(lead?.score || 0);

  const subject =
    score >= 70
      ? `Subject: Fast path to close ${company} this week`
      : `Subject: Clear next steps for ${company} (${stage})`;

  return [
    subject,
    ``,
    `Hi ${contactName},`,
    ``,
    `Great progress so far on ${company}. Since we are in ${stage}, I mapped a practical path to move ${valueText} to decision without adding complexity on your side.`,
    ``,
    `I can send a one-page plan covering:`,
    `- Decision timeline with owners and dates`,
    `- Risks to remove now so execution stays predictable`,
    ``,
    `If useful, I can walk through it in 15 minutes. Would Tuesday 11:30 AM or Wednesday 3:00 PM work better?`,
    ``,
    `Best regards,`
  ].join("\n");
}

export class CommunicationController {
  async createMeeting(req: Request, res: Response) {
    const user = (req as any).user;
    const leadId = firstString(req.body.leadId);
    const title = firstString(req.body.title) || "CRM Meeting";
    const selectedDate = firstString(req.body.selectedDate);
    const selectedTime = firstString(req.body.selectedTime);
    const meetingType = String(req.body.meetingType || "").toLowerCase();
    const attendees = normalizeParticipants(req.body.attendees);
    const phoneNumber = firstString(req.body.phoneNumber, req.body.phone, req.body.to);
    const description = firstString(req.body.description) || "";
    const reminders = req.body?.reminders && typeof req.body.reminders === "object"
      ? req.body.reminders
      : {};
    const emailReminderEnabled = reminders.email !== false;
    const whatsappReminderEnabled = reminders.whatsapp !== false;
    const reminderMinutesRaw = Number(req.body?.reminderMinutes);
    const reminderMinutes = Number.isFinite(reminderMinutesRaw)
      ? Math.max(1, Math.min(120, Math.round(reminderMinutesRaw)))
      : 10;

    if (!leadId || !selectedDate || !selectedTime || !meetingType) {
      return res.status(400).json({
        success: false,
        message: "leadId, selectedDate, selectedTime and meetingType are required"
      });
    }

    if (!["google_meet", "zoom", "phone"].includes(meetingType)) {
      return res.status(400).json({
        success: false,
        message: "meetingType must be google_meet, zoom, or phone"
      });
    }

    const lead = await db.lead.findFirst({
      where: {
        id: leadId,
        userId: user.id
      }
    });

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    const dateTime = combineDateAndTime(selectedDate, selectedTime);
    const leadEmail = normalizeEmail(lead.email);
    const participantEmails = attendees.length > 0
      ? uniqueEmails(attendees)
      : uniqueEmails([leadEmail]);
    const adminEmails = await resolveAdminNotificationEmails();
    const confirmationRecipients = uniqueEmails([...participantEmails, leadEmail, ...adminEmails]);
    const reminderRecipients = emailReminderEnabled
      ? uniqueEmails([...participantEmails, leadEmail, ...adminEmails])
      : [];

    const provider = await calendarService.createMeetingLink({
      meetingType: meetingType as "google_meet" | "zoom" | "phone",
      title,
      description,
      dateTimeISO: dateTime.toISOString(),
      attendees: participantEmails
    });

    const dbAny = db as any;
    const fallbackMeetingId = `meeting_${Date.now()}`;
    const meeting = await dbAny.meeting.create({
      data: {
        leadId,
        userId: user.id,
        title,
        meetingType,
        dateTime,
        meetingLink: provider.meetingLink,
        status: "scheduled",
        attendees: participantEmails,
        phoneNumber: phoneNumber || lead.phone || null,
        providerMeta: provider.providerMeta || null
      }
    }).catch(async () => {
      await db.platformState.create({
        data: {
          key: `meeting:${fallbackMeetingId}`,
          value: {
            id: fallbackMeetingId,
            leadId,
            userId: user.id,
            title,
            meetingType,
            dateTime: dateTime.toISOString(),
            meetingLink: provider.meetingLink,
            status: "scheduled",
            attendees: participantEmails,
            phoneNumber: phoneNumber || lead.phone || null,
            providerMeta: provider.providerMeta || null
          }
        }
      });

      return {
        id: fallbackMeetingId,
        status: "scheduled",
        meetingType,
        dateTime
      };
    });

    const dateText = dateTime.toLocaleDateString();
    const timeText = dateTime.toLocaleTimeString();
    const subject = `Meeting Scheduled - ${dateText} ${timeText}`;
    const emailMessage = [
      `A meeting \"${title}\" is scheduled on ${dateText} at ${timeText}.`,
      `Lead: ${lead.name || "Unknown"}${lead.company ? ` (${lead.company})` : ""}`,
      "",
      provider.meetingLink ? `Join here: ${provider.meetingLink}` : "This is a phone call. We will call you at the scheduled time.",
      "",
      "Thanks"
    ].join("\n");

    for (const attendee of confirmationRecipients) {
      await emailService.send({
        to: attendee,
        subject,
        text: emailMessage,
        userId: user.id
      });
    }

    const destinationPhone = whatsappReminderEnabled ? (phoneNumber || lead.phone) : undefined;
    if (destinationPhone) {
      const whatsappMessage = meetingType === "phone"
        ? `Hi ${lead.name || "there"}, we will call you at ${dateText} ${timeText}.`
        : `Hi ${lead.name || "there"}, your meeting is scheduled on ${dateText} at ${timeText}. Join here: ${provider.meetingLink}`;

      await whatsappService.send({
        to: destinationPhone,
        message: whatsappMessage,
        userId: user.id,
        leadId
      });
    }

    const activity = await db.activity.create({
      data: {
        userId: user.id,
        leadId,
        type: "meeting.scheduled",
        text: `${title} scheduled for ${dateText} ${timeText}`
      }
    });

    eventBus.emit(EVENTS.ACTIVITY_CREATED, activity);
    eventBus.emit(EVENTS.MEETING_SCHEDULED, {
      meetingId: meeting.id,
      leadId,
      userId: user.id,
      meetingType,
      meetingLink: provider.meetingLink,
      dateTime: dateTime.toISOString()
    });
    eventBus.emit(EVENTS.AI_RECALCULATION_REQUESTED, {
      leadId,
      userId: user.id,
      reason: "meeting.scheduled"
    });
    eventBus.emit(EVENTS.NOTIFICATION_REQUESTED, {
      userId: user.id,
      channel: "IN_APP",
      title: "Meeting scheduled",
      message: `Meeting scheduled for ${lead.name || "lead"} at ${dateText} ${timeText}`,
      meta: { leadId, meetingId: meeting.id }
    });
    eventBus.emit(EVENTS.DASHBOARD_REFRESH_REQUESTED, {
      userId: user.id,
      leadId,
      reason: "meeting.scheduled"
    });

    const now = Date.now();
    const reminderDelayMs = dateTime.getTime() - now - reminderMinutes * 60 * 1000;
    if (reminderDelayMs > 0) {
      await addMeetingJob({
        type: "reminder",
        meetingId: meeting.id,
        leadId,
        userId: user.id,
        leadName: lead.name,
        title,
        meetingType,
        dateTimeISO: dateTime.toISOString(),
        meetingLink: provider.meetingLink || undefined,
        phoneNumber: destinationPhone || undefined,
        attendees: reminderRecipients,
        reminderMinutes,
        delayMs: reminderDelayMs
      });
    }

    const missedCheckDelay = dateTime.getTime() - now + 15 * 60 * 1000;
    if (missedCheckDelay > 0) {
      await addMeetingJob({
        type: "missed-check",
        meetingId: meeting.id,
        leadId,
        userId: user.id,
        leadName: lead.name,
        title,
        meetingType,
        dateTimeISO: dateTime.toISOString(),
        meetingLink: provider.meetingLink || undefined,
        phoneNumber: destinationPhone || undefined,
        attendees: participantEmails,
        delayMs: missedCheckDelay
      });
    }

    return res.status(201).json({
      success: true,
      meetingLink: provider.meetingLink,
      status: provider.status,
      providerMeta: provider.providerMeta || null,
      message: "Meeting created and notifications sent"
    });
  }

  // ======================
  // SEND EMAIL
  // ======================
  async sendEmail(req: Request, res: Response) {
    const user = (req as any).user;
    const leadId = firstString(req.body.leadId);
    const to = firstString(req.body.to, req.body.email, req.body.recipient, req.body.recipientEmail);
    const subject = firstString(req.body.subject, req.body.title);
    const text = firstString(req.body.text, req.body.body, req.body.message, req.body.content);
    const html = firstString(req.body.html);

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: "Missing email"
      });
    }

    const result = await emailService.send({
      ...req.body,
      to,
      subject,
      text,
      html,
      userId: user.id
    });

    eventBus.emit(EVENTS.EMAIL_SENT, {
      ...result,
      leadId,
      userId: user.id
    });

    res.json({ success: true, data: result });
  }

  // ======================
  // AI EMAIL GENERATION
  // ======================
  async generateEmail(req: Request, res: Response) {
    const { lead } = req.body;

    if (!lead) {
      return res.status(400).json({
        success: false,
        message: "Lead data required"
      });
    }

    const prompt = `
${buildAIFollowupEmailPrompt({
      contactName: lead.name,
      company: lead.company,
      stage: lead.stage,
      value: lead.value,
      score: lead.score,
      recentActivity: lead.lastActivity || lead.summary
    })}
`;

    const generated = await aiService.generateText(prompt);
    const candidate = stripJsonWrapperIfNeeded(generated);
    const finalText = isFallbackAIText(candidate) || isLowQualityEmail(candidate)
      ? buildFallbackEmail(lead)
      : candidate;

    res.json({
      success: true,
      data: finalText
    });
  }

  async generateWhatsApp(req: Request, res: Response) {
    const { lead, context } = req.body;

    if (!lead) {
      return res.status(400).json({
        success: false,
        message: "Lead data required"
      });
    }

    const prompt = [
      "Generate a concise WhatsApp sales follow-up.",
      "Return plain text only.",
      `Lead: ${lead.name || "Unknown"}`,
      `Company: ${lead.company || "Unknown"}`,
      `Stage: ${lead.stage || "Discovery"}`,
      `Score: ${lead.score || 0}`,
      `Context: ${context || lead.lastActivity || "Follow up on prior discussion"}`
    ].join("\n");

    const text = await withTimeout(
      aiService.generateText(prompt),
      5000,
      "AI timeout; using deterministic WhatsApp fallback"
    );

    const candidate = String(text || "").trim();
    const finalText = !candidate || isFallbackAIText(candidate)
      ? buildFallbackWhatsApp(lead, context)
      : candidate;

    return res.json({
      success: true,
      data: finalText
    });
  }

  // ======================
  // SEND WHATSAPP
  // ======================
  async sendWhatsApp(req: Request, res: Response) {
    const user = (req as any).user;
    const to = firstString(req.body.to, req.body.phone, req.body.number, req.body.recipient);
    const message = firstString(req.body.message, req.body.text, req.body.body, req.body.content);
    const leadId = firstString(req.body.leadId);

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing WhatsApp fields"
      });
    }

    const result = await whatsappService.send({
      ...req.body,
      to,
      message,
      userId: user.id,
      leadId
    });

    res.json({ success: true, data: result });
  }

  // ======================
  // SCHEDULE CALL
  // ======================
  async scheduleCall(req: Request, res: Response) {
    const user = (req as any).user;
    const time = firstString(req.body.time, req.body.date, req.body.dateTime, req.body.scheduledAt);
    const participants = normalizeParticipants(req.body.participants ?? req.body.attendees ?? req.body.emails);
    const leadId = firstString(req.body.leadId);

    if (!time || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing schedule fields"
      });
    }

    const result = await calendarService.schedule({
      ...req.body,
      time,
      participants,
      userId: user.id,
      leadId
    });

    eventBus.emit(EVENTS.MEETING_SCHEDULED, result);

    res.json({ success: true, data: result });
  }

  async markEmailOpened(req: Request, res: Response) {
    const user = (req as any).user;
    const leadId = firstString(req.body.leadId, req.body.contactId);

    if (!leadId) {
      return res.status(400).json({ success: false, message: "leadId is required" });
    }

    eventBus.emit(EVENTS.EMAIL_OPENED, {
      leadId,
      userId: user.id,
      messageId: firstString(req.body.messageId),
      at: new Date().toISOString()
    });

    return res.json({ success: true });
  }

  async markEmailReplied(req: Request, res: Response) {
    const user = (req as any).user;
    const leadId = firstString(req.body.leadId, req.body.contactId);

    if (!leadId) {
      return res.status(400).json({ success: false, message: "leadId is required" });
    }

    eventBus.emit(EVENTS.EMAIL_REPLIED, {
      leadId,
      userId: user.id,
      messageId: firstString(req.body.messageId),
      text: firstString(req.body.text, req.body.body)
    });

    return res.json({ success: true });
  }

  async markWhatsappReplied(req: Request, res: Response) {
    const user = (req as any).user;
    const leadId = firstString(req.body.leadId, req.body.contactId);

    if (!leadId) {
      return res.status(400).json({ success: false, message: "leadId is required" });
    }

    eventBus.emit(EVENTS.WHATSAPP_REPLIED, {
      leadId,
      userId: user.id,
      text: firstString(req.body.text, req.body.body, req.body.message)
    });

    return res.json({ success: true });
  }

  async markMeetingOutcome(req: Request, res: Response) {
    const user = (req as any).user;
    const leadId = firstString(req.body.leadId, req.body.contactId);
    const status = String(req.body.status || "").toLowerCase();

    if (!leadId || !status) {
      return res.status(400).json({ success: false, message: "leadId and status are required" });
    }

    const payload = {
      leadId,
      userId: user.id,
      meetingId: firstString(req.body.meetingId)
    };

    const dbAny = db as any;
    if (payload.meetingId && dbAny.meeting?.update) {
      await dbAny.meeting.update({
        where: { id: payload.meetingId },
        data: { status }
      }).catch(() => undefined);
    }

    if (status === "completed") {
      eventBus.emit(EVENTS.MEETING_COMPLETED, payload);
    } else if (status === "missed") {
      eventBus.emit(EVENTS.MEETING_MISSED, payload);
    } else {
      return res.status(400).json({ success: false, message: "status must be completed or missed" });
    }

    return res.json({ success: true });
  }
}

function combineDateAndTime(selectedDate: string, selectedTime: string) {
  const date = String(selectedDate || "").trim();
  const time = String(selectedTime || "").trim();

  if (!date || !time) {
    throw new Error("selectedDate and selectedTime are required");
  }

  const dateTime = new Date(`${date}T${time}:00`);
  if (isNaN(dateTime.getTime())) {
    throw new Error("Invalid selectedDate/selectedTime");
  }

  return dateTime;
}