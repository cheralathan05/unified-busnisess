// auto-generated
import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: "Too many requests, try again later",
  standardHeaders: true,
  legacyHeaders: false,
});