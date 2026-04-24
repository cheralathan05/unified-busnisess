import { ActivityRepository } from "./activity.repository";
import { eventBus } from "../../core/events/eventBus";
import { db } from "../../config/db";
import { ActivityDTO } from "../../dto/activity.dto";

const repo = new ActivityRepository();

const httpError = (status: number, message: string) => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

export class ActivityService {
  async create(input: any, user: any) {
    if (!input?.leadId || typeof input.leadId !== "string") {
      throw httpError(400, "leadId is required");
    }

    if (!input?.type || typeof input.type !== "string") {
      throw httpError(400, "type is required");
    }

    if (input.leadId === "leadId") {
      throw httpError(400, "Invalid leadId. Use real lead UUID from create lead response");
    }

    const lead = await db.lead.findUnique({
      where: { id: input.leadId },
      select: { id: true, userId: true }
    });

    if (!lead) {
      throw httpError(404, "LEAD_NOT_FOUND");
    }

    if (lead.userId !== user.id) {
      throw httpError(403, "NOT_OWNER");
    }

    const normalized = {
      leadId: input.leadId,
      type: input.type,
      text: input.note ?? input.text ?? null,
      status: typeof input.status === "string" ? input.status : null
    };

    const activity = await repo.create({
      ...normalized,
      userId: user.id
    });

    eventBus.emit("activity.created", activity);
    return ActivityDTO.toResponse(activity);
  }

  async getAll(query: any, user: any) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);

    const activities = await repo.findAll(user.id, {
      ...query,
      skip: (page - 1) * limit,
      take: limit
    });

    return ActivityDTO.toList(activities);
  }

  async getByLead(leadId: string, user: any) {
    const activities = await repo.findByLead(leadId, user.id);
    return ActivityDTO.toList(activities);
  }
}