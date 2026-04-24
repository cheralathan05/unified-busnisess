import { db } from "../../config/db";

export class ActivityRepository {
  create(data: any) {
    return db.activity.create({ data });
  }

  findAll(userId: string, filters: any) {
    return db.activity.findMany({
      where: {
        userId,
        ...(filters.leadId && { leadId: filters.leadId })
      },
      orderBy: { createdAt: "desc" },
      skip: filters.skip,
      take: filters.take
    });
  }

  findByLead(leadId: string, userId: string) {
    return db.activity.findMany({
      where: { leadId, userId },
      orderBy: { createdAt: "desc" }
    });
  }
}