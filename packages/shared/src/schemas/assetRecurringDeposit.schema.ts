import { z } from "zod";

export const assetRecurringDepositSchema = z.object({
  bank: z.string().min(1, "Bank is required"),
  monthly_installment: z.number().positive("Monthly installment must be greater than 0"),
  rate_pct: z.number().nonnegative(),
  start_date: z.string().min(1, "Start date is required"),
  maturity_date: z.string().min(1, "Maturity date is required"),
  maturity_value: z.number().nonnegative(),
});

export type AssetRecurringDepositInput = z.infer<typeof assetRecurringDepositSchema>;
