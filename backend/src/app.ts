// src/app.ts

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";

import routes from "./routes";
import { errorMiddleware } from "./middleware/error.middleware";

// 🔥 EVENTS (CRITICAL FOR AI + AUTOMATION)
import "./events";

// 🔥 JOBS (ALL BACKGROUND AUTOMATION)
import { startOtpCleanup } from "./jobs/otpCleanup.job";
import { startEmailQueue } from "./jobs/emailQueue.job";
import { startSessionCleanup } from "./jobs/sessionCleanup.job";
import { startTokenCleanup } from "./jobs/tokenCleanup.job";
import { startAuditCleanup } from "./jobs/auditCleanup.job";

// ✅ NEW CRM JOBS
import { startJobs } from "./jobs/jobRunner";

// 🔥 QUEUES (ASYNC WORKERS)
import { startEmailWorker } from "./queues/email.queue";
import { startNotificationWorker } from "./queues/notification.queue";
import { startAuditWorker } from "./queues/audit.queue";
import { startMeetingWorker } from "./queues/meeting.queue";

const app = express();

// ======================
// GLOBAL MIDDLEWARE
// ======================
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Passport (social auth)
app.use(passport.initialize());

// ======================
// HEALTH CHECK (IMPORTANT)
// ======================
app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    service: "CRM AI Backend",
    time: new Date()
  });
});

// ======================
// ROUTES
// ======================
app.use("/api", routes);
// Compatibility alias for malformed clients sending "/api%20/...".
app.use("/api ", routes);

// ======================
// ERROR HANDLER
// ======================
app.use(errorMiddleware);

// ======================
// START BACKGROUND JOBS
// ======================
if (process.env.NODE_ENV !== "test") {
  // Existing jobs
  startOtpCleanup();
  startEmailQueue();
  startSessionCleanup();
  startTokenCleanup();
  startAuditCleanup();

  // 🔥 CRM + AI JOBS
  startJobs();
}

// ======================
// START QUEUE WORKERS
// ======================
if (process.env.NODE_ENV !== "test") {
  const enableQueueWorkers =
    process.env.ENABLE_QUEUE_WORKERS === "true" || process.env.NODE_ENV === "production";

  if (enableQueueWorkers) {
    startEmailWorker();
    startNotificationWorker();
    startAuditWorker();
    startMeetingWorker();
  } else {
    console.warn(
      "⚠️ Queue workers are disabled in development. Set ENABLE_QUEUE_WORKERS=true to enable them."
    );
  }
}

export default app;