import { z } from "zod";

export const assetNpsSchema = z.object({
  pran_number: z.string().min(1, "PRAN number is required"),
  current_value: z.number().nonnegative(),
  tier: z.enum(["Tier I", "Tier II"]),
});

export type AssetNpsInput = z.infer<typeof assetNpsSchema>;
