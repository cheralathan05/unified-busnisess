import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { env } from "../config/env";
import { db } from "../config/db";
import { EmailService } from "../modules/communication/email.service";
import { WhatsAppService } from "../modules/communication/whatsapp.service";
import { eventBus } from "../core/events/eventBus";
import { EVENTS } from "../constants/event.constants";

type MeetingJobType = "reminder" | "missed-check";

type MeetingNotificationJob = {
  type: MeetingJobType;
  meetingId: string;
  leadId: string;
  userId: string;
  leadName: string;
  title: string;
  meetingType: string;
  dateTimeISO: string;
  meetingLink?: string;
  phoneNumber?: string;
  attendees?: string[];
  reminderMinutes?: number;
  delayMs?: number;
};

const queueName = "meeting-automation-queue";
let connection: Redis | null = null;
let queue: Queue<MeetingNotificationJob> | null = null;
let warnedMeetingRedis = false;

function getConnection(): Redis {
  if (connection) return connection;

  connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (process.env.NODE_ENV !== "production" && times > 3) {
        return null;
      }
      return Math.min(times * 200, 2000);
    }
  });

  connection.on("error", (error) => {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ Meeting queue Redis error:", error);
      return;
    }

    if (!warnedMeetingRedis) {
      warnedMeetingRedis = true;
      console.warn(
        "⚠️ Meeting queue Redis unavailable; meeting jobs are temporarily disabled.",
        (error as Error).message
      );
    }
  });

  return connection;
}

function getQueue(): Queue<MeetingNotificationJob> {
  if (queue) return queue;
  queue = new Queue<MeetingNotificationJob>(queueName, { connection: getConnection() });

  // BullMQ Queue emits "error" when Redis is unavailable.
  // Register listener so Node does not terminate on unhandled queue errors.
  queue.on("error", (error) => {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ Meeting queue error:", error);
      return;
    }

    if (!warnedMeetingRedis) {
      warnedMeetingRedis = true;
      console.warn("⚠️ Meeting queue disabled because Redis is unavailable.");
    }
  });

  return queue;
}
const emailService = new EmailService();
const whatsappService = new WhatsAppService();

function isMeetingStillScheduled(meeting: any) {
  return String(meeting?.status || "").toLowerCase() === "scheduled";
}

export async function addMeetingJob(job: MeetingNotificationJob) {
  try {
    await getQueue().add(job.type, job, {
      delay: Math.max(0, Number(job.delayMs || 0)),
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 200,
      removeOnFail: 200
    });
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    if (!warnedMeetingRedis) {
      warnedMeetingRedis = true;
      console.warn("⚠️ Skipping meeting queue job because Redis is unavailable.");
    }
  }
}

export function startMeetingWorker() {
  const queueConnection = getConnection();
  getQueue();

  const worker = new Worker<MeetingNotificationJob>(
    queueName,
    async (job) => {
      const data = job.data;
      const dbAny = db as any;
      const meeting = await dbAny.meeting?.findUnique?.({ where: { id: data.meetingId } });

      if (!meeting) return { skipped: true, reason: "meeting_not_found" };
      if (!isMeetingStillScheduled(meeting)) {
        return { skipped: true, reason: "meeting_not_scheduled" };
      }

      const dateText = new Date(data.dateTimeISO).toLocaleString();

      if (data.type === "reminder") {
        const reminderMinutes = Math.max(1, Number(data.reminderMinutes || 60));
        const subject = `Reminder: ${data.title} in ${reminderMinutes} minute${reminderMinutes === 1 ? "" : "s"}`;
        const body = [
          `Hi ${data.leadName || "there"},`,
          "",
          `This is a reminder for your meeting scheduled at ${dateText}.`,
          data.meetingLink ? `Join link: ${data.meetingLink}` : "We will call you at the scheduled time.",
          "",
          "Thanks"
        ].join("\n");

        if (Array.isArray(data.attendees)) {
          for (const attendee of data.attendees) {
            await emailService.send({
              to: attendee,
              subject,
              text: body,
              userId: data.userId
            });
          }
        }

        if (data.phoneNumber) {
          await whatsappService.send({
            to: data.phoneNumber,
            message: data.meetingLink
              ? `Reminder (${reminderMinutes}m): meeting at ${dateText}. Join here: ${data.meetingLink}`
              : `Reminder (${reminderMinutes}m): we will call you at ${dateText}.`,
            userId: data.userId,
            leadId: data.leadId
          });
        }

        await db.activity.create({
          data: {
            userId: data.userId,
            leadId: data.leadId,
            type: "meeting.reminder.sent",
            text: `Meeting reminder sent for ${dateText}`
          }
        });

        eventBus.emit(EVENTS.ACTIVITY_CREATED, {
          userId: data.userId,
          leadId: data.leadId,
          type: "meeting.reminder.sent",
          text: `Meeting reminder sent for ${dateText}`
        });

        return { sent: true, type: data.type };
      }

      const meetingTime = new Date(data.dateTimeISO).getTime();
      if (Date.now() < meetingTime) {
        return { skipped: true, reason: "meeting_time_not_reached" };
      }

      await dbAny.meeting.update({
        where: { id: data.meetingId },
        data: { status: "missed" }
      });

      await db.activity.create({
        data: {
          userId: data.userId,
          leadId: data.leadId,
          type: "meeting.missed",
          text: `Meeting marked missed for ${dateText}`
        }
      });

      eventBus.emit(EVENTS.MEETING_MISSED, {
        meetingId: data.meetingId,
        leadId: data.leadId,
        userId: data.userId
      });

      return { updated: true, type: data.type };
    },
    { connection: queueConnection }
  );

  worker.on("completed", (job) => {
    console.log("✅ Meeting automation completed:", job.id);
  });

  worker.on("failed", (job, error) => {
    console.error("❌ Meeting automation failed:", job?.id, error?.message || error);
  });
}
