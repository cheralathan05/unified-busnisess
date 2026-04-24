import { Request, Response } from "express";
import { brainService } from "./brain.service";
import { DecisionStatus } from "./brain.types";

const ALL_STATUSES: DecisionStatus[] = ["suggested", "approved", "rejected", "executed"];

function parseStatuses(raw: unknown): DecisionStatus[] {
  const value = String(raw || "").trim().toLowerCase();
  if (!value || value === "suggested") return ["suggested"];
  if (value === "all") return ALL_STATUSES;

  const parsed = value
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is DecisionStatus => ALL_STATUSES.includes(s as DecisionStatus));

  return parsed.length > 0 ? parsed : ["suggested"];
}

export class BrainController {
  async getSuggestions(req: Request, res: Response) {
    const user = (req as any).user;
    const statuses = parseStatuses(req.query.status);

    const [suggestions, counts] = await Promise.all([
      brainService.getSuggestions(user.id, statuses),
      brainService.getSuggestionCounts(user.id)
    ]);

    const total = counts.suggested + counts.approved + counts.rejected + counts.executed;
    const emptyReason =
      suggestions.length > 0
        ? null
        : total === 0
          ? "NO_DECISIONS_CREATED"
          : counts.suggested === 0
            ? "ALL_DECISIONS_PROCESSED"
            : "NO_MATCHING_STATUS";

    res.json({
      success: true,
      data: suggestions,
      meta: {
        statusFilter: statuses,
        counts,
        emptyReason
      }
    });
  }

  async approveDecision(req: Request, res: Response) {
    const user = (req as any).user;
    const decisionId = String(req.params.id);
    const updated = await brainService.approveDecision(decisionId, user.id);

    res.json({ success: true, data: updated });
  }

  async rejectDecision(req: Request, res: Response) {
    const user = (req as any).user;
    const decisionId = String(req.params.id);
    const updated = await brainService.rejectDecision(decisionId, user.id);

    res.json({ success: true, data: updated });
  }
}
