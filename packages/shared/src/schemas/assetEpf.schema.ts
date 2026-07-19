import { z } from "zod";

export const assetEpfSchema = z.object({
  employer_name: z.string().min(1, "Employer name is required"),
  current_balance: z.number().nonnegative(),
  monthly_contribution: z.number().nonnegative(),
  uan_number: z.string().optional(),
});

export type AssetEpfInput = z.infer<typeof assetEpfSchema>;
