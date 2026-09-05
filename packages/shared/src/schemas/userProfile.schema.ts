import { z } from "zod";

export const userProfileSchema = z.object({
  date_of_birth: z.string().optional(),
  monthly_income: z.number().nonnegative().optional(),
  monthly_expense: z.number().nonnegative().optional(),
  number_of_dependents: z.number().int().nonnegative(),
  onboarding_completed: z.boolean(),
  monthly_report_email_enabled: z.boolean().optional(),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
