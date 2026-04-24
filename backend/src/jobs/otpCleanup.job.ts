// auto-generated
import { db } from "../config/db";

export const otpCleanupJob = async () => {
  try {
    const now = new Date();

    const deleted = await db.otp.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    console.log(`🧹 OTP Cleanup: ${deleted.count} removed`);
  } catch (error) {
    console.error("❌ OTP Cleanup Error:", error);
  }
};

// Run every 10 minutes
export const startOtpCleanup = () => {
  setInterval(otpCleanupJob, 10 * 60 * 1000);
};