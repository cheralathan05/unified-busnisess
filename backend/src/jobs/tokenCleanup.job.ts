// auto-generated
import { db } from "../config/db";

export const tokenCleanupJob = async () => {
  try {
    const now = new Date();

    const deleted = await db.token.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    console.log(`🧹 Tokens cleaned: ${deleted.count}`);
  } catch (error) {
    console.error("❌ Token Cleanup Error:", error);
  }
};

// Run every 30 minutes
export const startTokenCleanup = () => {
  setInterval(tokenCleanupJob, 30 * 60 * 1000);
};