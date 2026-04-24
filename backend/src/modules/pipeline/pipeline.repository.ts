import { db } from "../../config/db";

export class PipelineRepository {
  getPipeline(userId: string) {
    return db.lead.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  moveLead(leadId: string, userId: string, stage: string) {
    return db.lead.update({
      where: { id: leadId },
      data: { stage }
    });
  }

  getByStage(userId: string, stage: string) {
    return db.lead.findMany({
      where: { userId, stage }
    });
  }
}