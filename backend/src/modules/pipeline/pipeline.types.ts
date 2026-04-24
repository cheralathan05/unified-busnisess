export interface MoveLeadInput {
  leadId?: string;
  dealId?: string;
  stage?: string;
  toStage?: string;
}

export interface PipelineQuery {
  stage?: string;
}

export type PipelineStage = "new" | "qualified" | "proposal" | "closed";