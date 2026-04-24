// auto-generated
// src/modules/security/bruteForce.service.ts

import { redis } from "../../config/redis";

const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 15 * 60; // 15 minutes

export const checkBruteForce = async (key: string) => {
  const attempts = await redis.get(key);

  if (attempts && Number(attempts) >= MAX_ATTEMPTS) {
    throw new Error("Too many attempts. Try later.");
  }
};

export const recordFailedAttempt = async (key: string) => {
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, BLOCK_TIME);
  }
};

export const resetAttempts = async (key: string) => {
  await redis.del(key);
};