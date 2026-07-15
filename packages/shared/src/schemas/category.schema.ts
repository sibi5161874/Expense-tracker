import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  type: z.enum(["Income", "Expense", "Transfer"]),
});

export type CategoryInput = z.infer<typeof categorySchema>;
