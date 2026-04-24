export type BrainObservedEvent =
  | "lead.created"
  | "lead.updated"
  | "activity.created";

export type DecisionType =
  | "email_followup"
  | "lead_follow_up"
  | "call_schedule";

export type DecisionStatus = "suggested" | "approved" | "rejected" | "executed";

export interface BrainDecisionResult {
  type: DecisionType;
  recommendation: Record<string, unknown>;
  confidence: number;
}

export interface BrainEventInput {
  event: BrainObservedEvent;
  payload: {
    leadId?: string;
    id?: string;
  } & Record<string, unknown>;
}

export interface DecisionContext {
  lead: {
    id: string;
    userId: string;
    name: string;
    company: string;
    stage: string;
    score: number;
    value: number;
    promptVersion?: string | null;
    updatedAt: Date;
  };
  activities: Array<{
    id: string;
    type: string;
    text: string | null;
    createdAt: Date;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>;
}
