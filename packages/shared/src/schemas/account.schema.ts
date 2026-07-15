import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.string().min(1, "Account type is required"),
  opening_balance: z.number(),
  currency: z.string().min(1, "Currency is required"),
  is_active: z.boolean(),
});

export type AccountInput = z.infer<typeof accountSchema>;
