import { z } from "zod";

/** Capped at 20 turns / 4000 chars per message — this is a Q&A widget over the user's own
 * data, not an open-ended long-form chat, so there's no legitimate reason for either to be
 * larger, and both caps bound the per-request token cost. */
export const aiChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(20),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
