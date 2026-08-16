import { z } from "zod";

export const assetNscSchema = z.object({
  certificate_number: z.string().min(1, "Certificate number is required"),
  purchase_value: z.number().nonnegative(),
  maturity_value: z.number().nonnegative(),
  rate_pct: z.number().nonnegative(),
  purchase_date: z.string().min(1, "Purchase date is required"),
  maturity_date: z.string().min(1, "Maturity date is required"),
});

export type AssetNscInput = z.infer<typeof assetNscSchema>;
