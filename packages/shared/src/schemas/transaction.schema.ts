import { z } from "zod";

export const transactionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum(["Income", "Expense", "Transfer"]),
  category_id: z.string().uuid().nullable().optional(),
  sub_category: z.string().optional(),
  amount: z.number().positive("Amount must be greater than 0"),
  from_account_id: z.string().uuid("From account is required"),
  to_account_id: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
