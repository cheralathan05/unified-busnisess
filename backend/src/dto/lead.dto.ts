export class LeadDTO {
  static toResponse(lead: any) {
    return {
      id: lead.id,
      name: lead.name,
      company: lead.company,
      value: lead.value,
      score: lead.score,
      stage: lead.stage,
      createdAt: lead.createdAt
    };
  }

  static toList(leads: any[]) {
    return leads.map(this.toResponse);
  }
}