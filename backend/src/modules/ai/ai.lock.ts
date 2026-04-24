class AILock {
  private readonly active = new Set<string>();

  acquire(leadId: string): boolean {
    if (this.active.has(leadId)) return false;
    this.active.add(leadId);
    return true;
  }

  release(leadId: string) {
    this.active.delete(leadId);
  }

  isLocked(leadId: string): boolean {
    return this.active.has(leadId);
  }
}

export const aiLock = new AILock();
