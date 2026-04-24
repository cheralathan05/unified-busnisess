interface CacheEntry<T> {
  value: T;
  cachedAt: number;
}

class AICache {
  private readonly ttlMs: number;
  private readonly store = new Map<string, CacheEntry<unknown>>();

  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  getKey(leadId: string, updatedAt: Date | string): string {
    const ts = updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt;
    return `${leadId}:${ts}`;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T) {
    this.store.set(key, {
      value,
      cachedAt: Date.now()
    });

    // Basic cleanup to keep memory bounded.
    if (this.store.size > 5000) {
      const oldest = [...this.store.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt).slice(0, 500);
      for (const [k] of oldest) this.store.delete(k);
    }
  }
}

export const aiCache = new AICache();
