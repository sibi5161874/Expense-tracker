/**
 * A small delay between rapid-fire API calls in a test. E2E_MODE already bypasses every rate
 * limit (see lib/rateLimit.ts), so this exists only to keep genuinely intentional "hammer this
 * endpoint" tests (chaos-monkey, hacker) from overwhelming the dev server itself, not to dodge
 * a limit that no longer applies.
 */
export async function waitForRateLimit(ms = 100): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
