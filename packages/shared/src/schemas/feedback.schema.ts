import { z } from "zod";

export const feedbackSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
  screenshot: z
    .object({
      dataUrl: z.string(),
      filename: z.string(),
      contentType: z.string(),
    })
    .optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
