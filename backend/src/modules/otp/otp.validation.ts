// auto-generated
import { z } from "zod";

export const createOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    type: z.enum(["VERIFY_EMAIL", "RESET_PASSWORD"]),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
    type: z.enum(["VERIFY_EMAIL", "RESET_PASSWORD"]),
  }),
});