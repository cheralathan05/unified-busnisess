const DEFAULT_STAGES = [
  "Discovery",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost"
];

export class StageService {
  private stages: Record<string, string[]> = {};

  getStages(user: any) {
    return this.stages[user.id] || DEFAULT_STAGES;
  }

  updateStages(user: any, stages: string[]) {
    this.stages[user.id] = stages;
    return stages;
  }

  addStage(user: any, stage: string) {
    const current = this.getStages(user);

    if (!current.includes(stage)) {
      current.push(stage);
    }

    this.stages[user.id] = current;

    return current;
  }

  removeStage(user: any, stage: string) {
    const current = this.getStages(user).filter(s => s !== stage);

    this.stages[user.id] = current;

    return current;
  }
}