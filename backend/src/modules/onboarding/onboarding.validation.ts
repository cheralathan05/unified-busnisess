// auto-generated
import { z } from "zod";

export const startSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email().optional(),
  }).strict(),
});

export const businessSchema = z.object({
  body: z.object({
    companyName: z.string().min(2).optional(),
    businessName: z.string().min(2).optional(),
    industry: z.string().optional(),
    size: z.string().optional(),
    email: z.string().email().optional(),
  }).refine((body) => Boolean(body.companyName || body.businessName), {
    message: "Either companyName or businessName is required",
  }),
});

export const completeSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      companyName: z.string().min(2).optional(),
      email: z.string().email().optional(),
    })
    .strict()
    .refine((body) => Boolean(body.name || body.companyName), {
      message: "Either name or companyName is required",
    }),
});