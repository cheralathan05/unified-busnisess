// auto-generated
// src/queues/email.queue.ts

import { sendEmail } from "../config/mail";

type EmailJob = {
  to: string;
  subject: string;
  html: string;
};

const queue: EmailJob[] = [];
let processing = false;

export const addEmailJob = (job: EmailJob) => {
  queue.push(job);
};

const processEmailQueue = async () => {
  if (processing || queue.length === 0) return;

  processing = true;

  while (queue.length > 0) {
    const job = queue.shift();

    if (!job) continue;

    try {
      await sendEmail(job);
      console.log(`📧 Email sent to ${job.to}`);
    } catch (error) {
      console.error("❌ Email failed:", error);
    }
  }

  processing = false;
};

// Start worker
export const startEmailWorker = () => {
  setInterval(processEmailQueue, 3000);
};