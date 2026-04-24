import { z } from "zod";

// ======================
// COMMON TRANSFORMS
// ======================
const emailSchema = z
  .string()
  .email("Invalid email format")
  .transform((val) => val.toLowerCase().trim());

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(100, "Password too long")
  .transform((val) => val.trim());

const nameSchema = z
  .string()
  .min(2, "Name too short")
  .max(100, "Name too long")
  .transform((val) => val.trim());

// ======================
// REGISTER
// ======================
export const registerSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    companyName: z
      .string()
      .max(150)
      .optional()
      .transform((val) => val?.trim()),
  }).strict(),
});

// ======================
// LOGIN
// ======================
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }).strict(),
});