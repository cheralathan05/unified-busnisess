import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { env } from "../config/env";
import { sendNotification } from "../modules/notification/notification.service";

type NotificationChannel = "EMAIL" | "SMS" | "IN_APP";

type NotificationJob = {
  type: NotificationChannel;
  payload: any;
  delayMs?: number;
};

const queueName = "notification-queue";
let connection: Redis | null = null;
let notificationQueue: Queue<NotificationJob> | null = null;
let warnedNotificationRedis = false;

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
      console.error("❌ Notification queue Redis error:", error);
      return;
    }

    if (!warnedNotificationRedis) {
      warnedNotificationRedis = true;
      console.warn(
        "⚠️ Notification queue Redis unavailable; jobs are temporarily disabled.",
        (error as Error).message
      );
    }
  });

  return connection;
}

function getQueue(): Queue<NotificationJob> {
  if (notificationQueue) return notificationQueue;
  notificationQueue = new Queue<NotificationJob>(queueName, {
    connection: getConnection()
  });

  // BullMQ Queue emits "error" when Redis is unavailable.
  // Without this listener Node treats it as unhandled and crashes the process.
  notificationQueue.on("error", (error) => {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ Notification queue error:", error);
      return;
    }

    if (!warnedNotificationRedis) {
      warnedNotificationRedis = true;
      console.warn("⚠️ Notification queue disabled because Redis is unavailable.");
    }
  });

  return notificationQueue;
}

export const addNotificationJob = async (job: NotificationJob) => {
  try {
    await getQueue().add("notify", job, {
      delay: Math.max(0, Number(job.delayMs || 0)),
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    if (!warnedNotificationRedis) {
      warnedNotificationRedis = true;
      console.warn("⚠️ Skipping notification queue job because Redis is unavailable.");
    }
  }
};

export const startNotificationWorker = () => {
  const queueConnection = getConnection();
  getQueue();

  const worker = new Worker<NotificationJob>(
    queueName,
    async (job) => {
      const type = String(job.data.type || "IN_APP").toUpperCase() as NotificationChannel;
      const payload = job.data.payload || {};

      const input = {
        channel: type,
        to: String(payload.to || payload.userId || "system"),
        subject: payload.title || payload.subject || "CRM Notification",
        message: String(payload.message || "CRM event notification"),
        html: payload.html
      };

      await sendNotification(input);
      return { delivered: true };
    },
    { connection: queueConnection }
  );

  worker.on("completed", (job) => {
    console.log("✅ Notification delivered:", job.id);
  });

  worker.on("failed", (job, error) => {
    console.error("❌ Notification failed:", job?.id, error?.message || error);
  });
};