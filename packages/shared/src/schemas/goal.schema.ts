import { z } from "zod";

export const goalSchema = z.object({
  goal_name: z.string().min(1, "Goal name is required"),
  category: z.string().min(1, "Category is required"),
  target_amount: z.number().positive("Target amount must be greater than 0"),
  saved_amount: z.number().nonnegative("Saved amount must be non-negative"),
  target_date: z.string().min(1, "Target date is required"),
  priority: z.enum(["High", "Medium", "Low"]),
});

export type GoalInput = z.infer<typeof goalSchema>;
