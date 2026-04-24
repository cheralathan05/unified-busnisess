// auto-generated
// src/modules/rate-limit/rateLimit.service.ts

import { redis } from "../../config/redis";
import { RateLimitOptions } from "./rateLimit.types";

/**
 * Check if request is allowed
 */
export const checkRateLimit = async (options: RateLimitOptions) => {
  const { key, limit, windowSeconds } = options;

  const redisKey = `rate_limit:${key}`;

  const current = await redis.incr(redisKey);

  // First request → set expiry
  if (current === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  if (current > limit) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: limit - current,
  };
};

/**
 * Reset rate limit manually (optional)
 */
export const resetRateLimit = async (key: string) => {
  const redisKey = `rate_limit:${key}`;
  await redis.del(redisKey);
};