import { z } from "zod";

export const assetLoanLiabilitySchema = z.object({
  lender: z.string().min(1, "Lender is required"),
  outstanding: z.number().nonnegative(),
  emi: z.number().nonnegative().nullable().optional(),
  interest_rate_pct: z.number().nullable().optional(),
  months_left: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().optional(),
});

export type AssetLoanLiabilityInput = z.infer<typeof assetLoanLiabilitySchema>;
