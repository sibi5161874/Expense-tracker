import { z } from "zod";

export const assetRealEstateSchema = z.object({
  description: z.string().min(1, "Description is required"),
  property_type: z.enum(["Residential", "Commercial", "Land", "Other"]),
  location: z.string().optional(),
  purchase_value: z.number().nonnegative(),
  current_value: z.number().nonnegative(),
  purchase_date: z.string().min(1, "Purchase date is required"),
});

export type AssetRealEstateInput = z.infer<typeof assetRealEstateSchema>;
