import { z } from "zod";

export const assetSsySchema = z.object({
  account_holder_name: z.string().min(1, "Account holder name is required"),
  account_number: z.string().min(1, "Account number is required"),
  current_balance: z.number().nonnegative(),
  opening_date: z.string().min(1, "Opening date is required"),
});

export type AssetSsyInput = z.infer<typeof assetSsySchema>;
