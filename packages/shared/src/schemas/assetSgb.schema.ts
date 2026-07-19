import { z } from "zod";

export const assetSgbSchema = z.object({
  units_held: z.number().positive("Units held must be greater than 0"),
  issue_price: z.number().positive("Issue price must be greater than 0"),
  issue_date: z.string().min(1, "Issue date is required"),
  rate_per_gram: z.number().positive("Rate per gram must be greater than 0"),
});

export type AssetSgbInput = z.infer<typeof assetSgbSchema>;
