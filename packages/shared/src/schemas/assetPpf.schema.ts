import { z } from "zod";

export const assetPpfSchema = z.object({
  account_number: z.string().min(1, "Account number is required"),
  current_balance: z.number().nonnegative(),
  annual_contribution: z.number().nonnegative(),
  opening_date: z.string().min(1, "Opening date is required"),
});

export type AssetPpfInput = z.infer<typeof assetPpfSchema>;
