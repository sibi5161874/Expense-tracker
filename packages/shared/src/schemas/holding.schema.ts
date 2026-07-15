import { z } from "zod";

export const holdingSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  display_name: z.string().optional(),
  live_price: z.number().nonnegative(),
});

export type HoldingInput = z.infer<typeof holdingSchema>;
