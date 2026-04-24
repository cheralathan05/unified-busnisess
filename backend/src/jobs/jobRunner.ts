import cron from "node-cron";
import { aiRescoreJob } from "./aiRescore.job";
import { inactivityDetectionJob } from "./inactivityDetection.job";

export function startJobs() {
  // Every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    await aiRescoreJob();
  });

  // Every hour
  cron.schedule("0 * * * *", async () => {
    await inactivityDetectionJob();
  });

  console.log("Jobs started...");
}