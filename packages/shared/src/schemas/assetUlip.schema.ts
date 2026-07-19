import { z } from "zod";

export const assetUlipSchema = z.object({
  insurer: z.string().min(1, "Insurer is required"),
  policy_number: z.string().min(1, "Policy number is required"),
  sum_assured: z.number().nonnegative(),
  current_fund_value: z.number().nonnegative(),
  premium_amount: z.number().nonnegative(),
  premium_frequency: z.enum(["Monthly", "Quarterly", "Half-Yearly", "Yearly"]),
  maturity_date: z.string().min(1, "Maturity date is required"),
});

export type AssetUlipInput = z.infer<typeof assetUlipSchema>;
