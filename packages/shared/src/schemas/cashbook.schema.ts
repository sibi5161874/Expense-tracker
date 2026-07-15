import { z } from "zod";

export const cashbookSchema = z.object({
  date: z.string().min(1, "Date is required"),
  counterparty: z.string().min(1, "Counterparty is required"),
  flow: z.enum(["Gave", "Received"]),
  amount: z.number().positive("Amount must be greater than 0"),
  due_date: z.string().nullable().optional(),
  account_used_id: z.string().uuid().nullable().optional(),
  loan_id: z.string().optional(),
  notes: z.string().optional(),
});

export type CashbookInput = z.infer<typeof cashbookSchema>;
