// auto-generated
import { db } from "../config/db";

export const sessionCleanupJob = async () => {
  try {
    const now = new Date();

    const deleted = await db.session.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    console.log(`🧹 Sessions cleaned: ${deleted.count}`);
  } catch (error) {
    console.error("❌ Session Cleanup Error:", error);
  }
};

// Run every 30 minutes
export const startSessionCleanup = () => {
  setInterval(sessionCleanupJob, 30 * 60 * 1000);
};