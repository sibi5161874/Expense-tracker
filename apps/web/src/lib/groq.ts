import Groq from 'groq-sdk';

/**
 * Server-only Groq client, same lazy-init/env-gated shape as getResendClient in resend.ts.
 * Groq over Claude/OpenAI/Gemini here — it provides ultra-fast inference and a genuinely free
 * tier (no credit card required to generate an API key, high rate limits), along with OpenAI-compatible
 * tool/function calling to query the user's live financial data.
 * The AI chat route returns a clear 503 when this is null rather than crashing.
 */
let client: Groq | null = null;

export function getGroqClient(): Groq | null {
  if (client) return client;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  client = new Groq({ apiKey });
  return client;
}

/** High-accuracy model with function calling supported on Groq. */
export const AI_CHAT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

/** Hard per-call ceiling so a slow/hung upstream request fails fast with a clear error instead
 * of leaving the chat widget spinning indefinitely. */
export const AI_CHAT_TIMEOUT_MS = 25_000;
