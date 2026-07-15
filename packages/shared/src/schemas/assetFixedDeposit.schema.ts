import { z } from "zod";

export const assetFixedDepositSchema = z.object({
  bank: z.string().min(1, "Bank is required"),
  principal: z.number().positive("Principal must be greater than 0"),
  maturity_value: z.number().positive("Maturity value must be greater than 0"),
  maturity_date: z.string().min(1, "Maturity date is required"),
  rate_pct: z.number(),
  withdrawn: z.boolean(),
});

export type AssetFixedDepositInput = z.infer<typeof assetFixedDepositSchema>;
