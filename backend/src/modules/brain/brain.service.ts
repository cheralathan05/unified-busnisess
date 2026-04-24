import { db } from "../../config/db";
import { Prisma } from "@prisma/client";
import { eventBus } from "../../core/events/eventBus";
import { EVENTS } from "../../constants/event.constants";
import { enrichLeadWithAI } from "../ai/ai.service";
import { executeAction } from "../ai/ai.actions";
import {
  BrainEventInput,
  BrainObservedEvent,
  BrainDecisionResult,
  DecisionContext,
  DecisionStatus
} from "./brain.types";
import { runBrainEngine } from "./brain.engine";

const OBSERVED_EVENTS: ReadonlySet<BrainObservedEvent> = new Set([
  "lead.created",
  "lead.updated",
  "activity.created"
]);

export class BrainService {
  async processEvent(input: BrainEventInput) {
    if (!OBSERVED_EVENTS.has(input.event)) return null;
    if (input.payload?.source === "ai") return null;

    const leadId = this.resolveLeadId(input.payload);
    if (!leadId) return null;

    const context = await this.buildContext(leadId);
    if (!context) return null;

    const ai = await enrichLeadWithAI(context.lead.id);

    eventBus.emit(EVENTS.LEAD_UPDATED, {
      id: context.lead.id,
      userId: context.lead.userId,
      source: "ai",
      summary: ai?.summary,
      insights: ai?.insights,
      nextAction: ai?.nextAction,
      confidence: ai?.confidence,
      priority: ai?.priority
    });

    const decision = this.generateDecision(context, ai);
    if (!decision) return null;

    decision.recommendation = {
      ...decision.recommendation,
      aiSummary: ai.summary,
      aiInsights: ai.insights,
      aiNextAction: ai.nextAction
    };

    return this.saveDecision(context, input, decision);
  }

  generateDecision(context: DecisionContext, ai?: any): BrainDecisionResult | null {
    const modelAction = String(ai?.nextAction || "").toLowerCase();

    if (modelAction === "email") {
      return {
        type: "email_followup",
        recommendation: {
          channel: "email",
          reason: "LLM suggested email as next best action"
        },
        confidence: Number(ai?.confidence || 0.7)
      };
    }

    if (modelAction === "call") {
      return {
        type: "call_schedule",
        recommendation: {
          channel: "call",
          reason: "LLM suggested call as next best action"
        },
        confidence: Number(ai?.confidence || 0.7)
      };
    }

    const ruleDecision = runBrainEngine(context);
    if (ruleDecision) return ruleDecision;

    return {
      type: "lead_follow_up",
      recommendation: {
        channel: "wait",
        reason: "No high-signal action detected"
      },
      confidence: Number(ai?.confidence || 0.5)
    };
  }

  async saveDecision(
    context: DecisionContext,
    input: BrainEventInput,
    decision: BrainDecisionResult
  ) {
    const created = await db.decision.create({
      data: {
        userId: context.lead.userId,
        leadId: context.lead.id,
        type: decision.type,
        input: {
          event: input.event,
          payload: input.payload,
          leadSnapshot: {
            score: context.lead.score,
            stage: context.lead.stage,
            value: context.lead.value
          }
        } as Prisma.InputJsonValue,
        recommendation: decision.recommendation as Prisma.InputJsonValue,
        confidence: decision.confidence,
        promptVersion: (decision.recommendation as any)?.promptVersion || context.lead.promptVersion || null,
        status: "suggested"
      }
    });

    eventBus.emit(EVENTS.BRAIN_DECISION_SUGGESTED, created);

    return created;
  }

  async getSuggestions(userId: string, statuses: DecisionStatus[] = ["suggested"]) {
    return db.decision.findMany({
      where: {
        userId,
        status: {
          in: statuses
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true,
            stage: true,
            score: true,
            value: true
          }
        }
      }
    });
  }

  async getSuggestionCounts(userId: string) {
    const grouped = await db.decision.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true }
    });

    const counts: Record<DecisionStatus, number> = {
      suggested: 0,
      approved: 0,
      rejected: 0,
      executed: 0
    };

    for (const row of grouped) {
      counts[row.status as DecisionStatus] = row._count._all;
    }

    return counts;
  }

  async approveDecision(decisionId: string, userId: string) {
    const decision = await this.resolveDecision(decisionId, userId);

    if (!decision) {
      throw new Error("Decision not found");
    }

    if (decision.status !== "suggested") {
      throw new Error("Only suggested decisions can be approved");
    }

    const updated = await db.decision.update({
      where: { id: decisionId },
      data: { status: "approved" }
    });

    await executeAction({
      ...updated,
      recommendation: updated.recommendation as unknown
    } as any);

    const latest = await db.decision.findUnique({ where: { id: decisionId } });
    const response = latest || updated;

    eventBus.emit(EVENTS.BRAIN_DECISION_APPROVED, response);

    return response;
  }

  async rejectDecision(decisionId: string, userId: string) {
    const decision = await this.resolveDecision(decisionId, userId);

    if (!decision) {
      throw new Error("Decision not found");
    }

    if (decision.status !== "suggested") {
      throw new Error("Only suggested decisions can be rejected");
    }

    const updated = await db.decision.update({
      where: { id: decisionId },
      data: { status: "rejected" }
    });

    eventBus.emit(EVENTS.BRAIN_DECISION_REJECTED, updated);

    return updated;
  }

  private async resolveDecision(idOrLeadId: string, userId: string) {
    return db.decision.findFirst({
      where: {
        userId,
        OR: [{ id: idOrLeadId }, { leadId: idOrLeadId, status: "suggested" }]
      },
      orderBy: { createdAt: "desc" }
    });
  }

  private async buildContext(leadId: string): Promise<DecisionContext | null> {
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        userId: true,
        name: true,
        company: true,
        stage: true,
        score: true,
        value: true,
        promptVersion: true,
        updatedAt: true
      }
    });

    if (!lead) return null;

    const [activities, payments] = await Promise.all([
      db.activity.findMany({
        where: { leadId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          text: true,
          createdAt: true
        }
      }),
      db.payment.findMany({
        where: { leadId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true
        }
      })
    ]);

    return {
      lead,
      activities,
      payments
    };
  }

  private resolveLeadId(payload: BrainEventInput["payload"]): string | null {
    if (typeof payload.leadId === "string" && payload.leadId.length > 0) {
      return payload.leadId;
    }

    if (typeof payload.id === "string" && payload.id.length > 0) {
      return payload.id;
    }

    return null;
  }
}

export const brainService = new BrainService();
