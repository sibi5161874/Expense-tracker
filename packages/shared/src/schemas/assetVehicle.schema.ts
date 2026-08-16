import { z } from "zod";

export const assetVehicleSchema = z.object({
  description: z.string().min(1, "Description is required"),
  vehicle_type: z.enum(["Car", "Two Wheeler", "Commercial", "Other"]),
  registration_number: z.string().optional(),
  purchase_value: z.number().nonnegative(),
  current_value: z.number().nonnegative(),
  purchase_date: z.string().min(1, "Purchase date is required"),
});

export type AssetVehicleInput = z.infer<typeof assetVehicleSchema>;
