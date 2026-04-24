import { PipelineRepository } from "./pipeline.repository";
import { eventBus } from "../../core/events/eventBus";
import { EVENTS } from "../../constants/event.constants";
import { MoveLeadInput, PipelineStage } from "./pipeline.types";

const repo = new PipelineRepository();
const ALLOWED_STAGES: PipelineStage[] = ["new", "qualified", "proposal", "closed"];

const httpError = (status: number, message: string) => {
  const error: any = new Error(message);
  error.status = status;
  return error;
};

const normalizeStage = (value: string) => String(value || "").trim().toLowerCase();

export class PipelineService {
  async getPipeline(user: any) {
    const leads = await repo.getPipeline(user.id);

    const grouped: any = {};

    for (const lead of leads) {
      if (!grouped[lead.stage]) {
        grouped[lead.stage] = {
          total: 0,
          count: 0,
          leads: []
        };
      }

      grouped[lead.stage].leads.push(lead);
      grouped[lead.stage].total += lead.value;
      grouped[lead.stage].count += 1;
    }

    return grouped;
  }

  async moveLead(input: MoveLeadInput, user: any) {
    const leadId = String(input?.leadId || input?.dealId || "").trim();
    const requestedStage = String(input?.stage || input?.toStage || "");
    const stage = normalizeStage(requestedStage);

    if (!leadId) {
      throw httpError(400, "leadId or dealId is required");
    }

    if (!stage) {
      throw httpError(400, "stage is required");
    }

    if (!ALLOWED_STAGES.includes(stage as PipelineStage)) {
      throw httpError(400, `Invalid stage. Allowed stages: ${ALLOWED_STAGES.join(", ")}`);
    }

    const updated = await repo.moveLead(
      leadId,
      user.id,
      stage
    );

    eventBus.emit(EVENTS.LEAD_UPDATED, {
      id: updated.id,
      userId: updated.userId,
      changes: { stage },
      source: "pipeline.move",
    });

    eventBus.emit(EVENTS.AI_RECALCULATION_REQUESTED, {
      leadId: updated.id,
      userId: updated.userId,
      reason: "pipeline.move",
    });

    eventBus.emit(EVENTS.DASHBOARD_REFRESH_REQUESTED, {
      userId: updated.userId,
      leadId: updated.id,
      reason: "pipeline.move",
    });

    return updated;
  }

  async getStage(stage: string, user: any) {
    const normalizedStage = normalizeStage(stage);
    if (!ALLOWED_STAGES.includes(normalizedStage as PipelineStage)) {
      throw httpError(400, `Invalid stage. Allowed stages: ${ALLOWED_STAGES.join(", ")}`);
    }
    return repo.getByStage(user.id, normalizedStage);
  }
}