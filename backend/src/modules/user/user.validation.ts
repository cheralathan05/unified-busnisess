// auto-generated
import { z } from "zod";

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    companyName: z.string().optional(),
  }),
});