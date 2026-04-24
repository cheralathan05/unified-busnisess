// auto-generated
import Redis from "ioredis";
import { env } from "./env";

let warnedRedisUnavailable = false;

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  retryStrategy(times) {
    // In local development, avoid endless ECONNREFUSED spam if Redis is down.
    if (process.env.NODE_ENV !== "production" && times > 3) {
      if (!warnedRedisUnavailable) {
        warnedRedisUnavailable = true;
        console.warn(
          "⚠️ Redis unavailable. Continuing without Redis-dependent features."
        );
      }
      return null;
    }

    return Math.min(times * 200, 2000);
  }
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Redis error:", err);
    return;
  }

  if (!warnedRedisUnavailable) {
    warnedRedisUnavailable = true;
    console.warn("⚠️ Redis connection failed:", (err as Error).message);
  }
});