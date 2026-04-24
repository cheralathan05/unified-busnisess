// auto-generated
// src/queues/audit.queue.ts

import { db } from "../config/db";

type AuditJob = {
  userId?: string;
  action: string;
  meta?: any;
};

const queue: AuditJob[] = [];
let processing = false;

export const addAuditJob = (job: AuditJob) => {
  queue.push(job);
};

const processAuditQueue = async () => {
  if (processing || queue.length === 0) return;

  processing = true;

  while (queue.length > 0) {
    const job = queue.shift();

    if (!job) continue;

    try {
      await db.audit.create({
        data: job,
      });

      console.log("📊 Audit saved:", job.action);
    } catch (error) {
      console.error("❌ Audit failed:", error);
    }
  }

  processing = false;
};

export const startAuditWorker = () => {
  setInterval(processAuditQueue, 3000);
};