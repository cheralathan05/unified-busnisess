export interface CreateActivityInput {
  type: string;
  note?: string;
  status?: string;
  leadId: string;
}

export interface ActivityQuery {
  leadId?: string;
  page?: number;
  limit?: number;
}