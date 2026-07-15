import { z } from "zod";

export const assetGoldSchema = z.object({
  description: z.string().min(1, "Description is required"),
  grams: z.number().positive("Grams must be greater than 0"),
  rate_per_gram: z.number().positive("Rate per gram must be greater than 0"),
  purchase_value: z.number().nonnegative(),
});

export type AssetGoldInput = z.infer<typeof assetGoldSchema>;
