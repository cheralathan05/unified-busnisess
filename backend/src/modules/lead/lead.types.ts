export interface CreateLeadInput {
  name: string;
  company: string;
  value: number;
  stage: string;
  email?: string;
  phone?: string;
}

export interface UpdateLeadInput {
  name?: string;
  company?: string;
  value?: number;
  stage?: string;
  score?: number;
}

export interface LeadQuery {
  search?: string;
  stage?: string;
  minScore?: number;
  maxScore?: number;
  page?: number;
  limit?: number;
}