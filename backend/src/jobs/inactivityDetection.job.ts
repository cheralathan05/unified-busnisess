import { db } from "../config/db";
import { eventBus } from "../core/events/eventBus";
import { EVENTS } from "../constants/event.constants";

export async function inactivityDetectionJob() {
  const leads = await db.lead.findMany({
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  const now = new Date();

  for (const lead of leads) {
    const lastActivity = lead.activities[0]?.createdAt;

    if (!lastActivity) continue;

    const diffHours =
      (now.getTime() - new Date(lastActivity).getTime()) /
      (1000 * 60 * 60);

    if (diffHours > 48) {
      eventBus.emit(EVENTS.LEAD_AT_RISK, {
        leadId: lead.id,
        userId: lead.userId,
        reason: "No activity > 48h"
      });

      eventBus.emit(EVENTS.LEAD_INACTIVE, {
        leadId: lead.id,
        userId: lead.userId,
        reason: "No activity > 48h"
      });
    }
  }

  console.log("Inactivity Job completed");
}