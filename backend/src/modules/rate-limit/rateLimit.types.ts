// auto-generated
// src/modules/rate-limit/rateLimit.types.ts

export interface RateLimitOptions {
  key: string;          // unique key (email/IP)
  limit: number;        // max requests
  windowSeconds: number; // time window
}