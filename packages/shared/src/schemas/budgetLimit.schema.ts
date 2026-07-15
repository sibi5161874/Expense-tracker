import { z } from "zod";

export const budgetLimitSchema = z.object({
  category_id: z.string().uuid("Category is required"),
  monthly_limit: z.number().nonnegative(),
});

export type BudgetLimitInput = z.infer<typeof budgetLimitSchema>;
