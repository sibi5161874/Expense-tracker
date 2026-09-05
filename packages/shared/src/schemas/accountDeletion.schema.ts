import { z } from "zod";

export const accountDeletionSchema = z.object({
  confirm_email: z.string().min(1),
});

export type AccountDeletionInput = z.infer<typeof accountDeletionSchema>;
