import { Resend } from 'resend';

/**
 * Server-only Resend client, same lazy-init/env-gated shape as getRazorpayClient in
 * razorpay.ts. Not in packages/shared for the same reason Razorpay isn't: this is a web-only
 * concern the mobile app has no business importing.
 *
 * Requires a Resend account, a verified sending domain, and RESEND_API_KEY /
 * RESEND_FROM_EMAIL set — none of which can be provisioned from code. Every call site checks
 * for a client before sending, so the app degrades to "cron runs, logs, sends nothing" rather
 * than crashing when these aren't configured yet.
 */
let client: Resend | null = null;

export function getResendClient(): Resend | null {
  if (client) return client;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  client = new Resend(apiKey);
  return client;
}

export function getResendFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
}
