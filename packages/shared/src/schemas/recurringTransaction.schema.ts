import { z } from "zod";

export const recurringTransactionSchema = z.object({
  type: z.enum(["Income", "Expense", "Transfer"]),
  category_id: z.string().uuid().nullable().optional(),
  sub_category: z.string().optional(),
  amount: z.number().positive("Amount must be greater than 0"),
  from_account_id: z.string().uuid("From account is required"),
  to_account_id: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
  frequency: z.enum(["Weekly", "Monthly", "Quarterly", "Yearly"]),
  next_run_date: z.string().min(1, "Start date is required"),
  is_active: z.boolean().optional(),
});

export type RecurringTransactionInput = z.infer<typeof recurringTransactionSchema>;
