// auto-generated
import { sendEmail } from "../config/mail";

type EmailJob = {
  to: string;
  subject: string;
  html: string;
  attempts: number;
  maxAttempts: number;
  resolve: () => void;
  reject: (error: unknown) => void;
};

const queue: EmailJob[] = [];
let processing = false;
let queueTimer: NodeJS.Timeout | null = null;

export const addEmailToQueue = (job: {
  to: string;
  subject: string;
  html: string;
}) => {
  return new Promise<void>((resolve, reject) => {
    queue.push({
      ...job,
      attempts: 0,
      maxAttempts: 3,
      resolve,
      reject
    });

    // Trigger immediate processing for time-sensitive emails like OTP.
    void processQueue();
  });
};

const processQueue = async () => {
  if (processing || queue.length === 0) return;

  processing = true;

  while (queue.length > 0) {
    const job = queue.shift();

    if (!job) continue;

    try {
      await sendEmail(job);
      console.log(`📧 Email sent to ${job.to}`);
      job.resolve();
    } catch (error) {
      job.attempts += 1;

      if (job.attempts < job.maxAttempts) {
        console.warn(
          `⚠️ Email retry ${job.attempts}/${job.maxAttempts - 1} for ${job.to}`
        );
        queue.push(job);
        continue;
      }

      console.error(`❌ Email failed permanently for ${job.to}:`, error);
      job.reject(error);
    }
  }

  processing = false;
};

// Run every second as a safety net for any missed immediate trigger.
export const startEmailQueue = () => {
  if (queueTimer) return;
  queueTimer = setInterval(() => {
    void processQueue();
  }, 1000);
};