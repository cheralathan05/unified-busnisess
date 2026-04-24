// auto-generated
import { db } from "../config/db";

export const auditCleanupJob = async () => {
  try {
    const days = 90; // keep 90 days logs
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const deleted = await db.audit.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });

    console.log(`🧹 Audit logs cleaned: ${deleted.count}`);
  } catch (error) {
    console.error("❌ Audit Cleanup Error:", error);
  }
};

// Run once per day
export const startAuditCleanup = () => {
  setInterval(auditCleanupJob, 24 * 60 * 60 * 1000);
};