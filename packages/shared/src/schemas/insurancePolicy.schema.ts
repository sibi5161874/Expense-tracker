import { z } from "zod";

export const insurancePolicySchema = z.object({
  policy_type: z.enum(["Term", "Health", "Motor", "Other"]),
  insurer: z.string().min(1, "Insurer is required"),
  policy_number: z.string().min(1, "Policy number is required"),
  coverage_amount: z.number().nonnegative(),
  premium_amount: z.number().nonnegative(),
  premium_due_date: z.string().min(1, "Premium due date is required"),
  nominee: z.string().optional(),
});

export type InsurancePolicyInput = z.infer<typeof insurancePolicySchema>;
