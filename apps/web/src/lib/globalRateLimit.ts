import type { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';

/** Per-user (or per-IP, when there is no cookie session) ceiling across every /api route, on top
 * of each route's own tighter limit. A backstop against a runaway client or script, not a budget
 * anyone should reach in normal use — a dashboard load makes a handful of API calls. */
export const GLOBAL_API_LIMIT = 100;
export const GLOBAL_API_WINDOW_MS = 60_000;

/** Server-to-server callers authenticate themselves (HMAC signature, CRON_SECRET) and arrive from
 * a provider's address, not a user — counting them against a per-IP budget could only ever drop a
 * legitimate payment or cron event. */
const EXEMPT_PREFIXES = ['/api/payments/webhook', '/api/cron/'];

export function isGloballyRateLimitedPath(pathname: string): boolean {
  if (!pathname.startsWith('/api/')) return false;
  return !EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Returns a 429 response, or null to continue. Fails open: this runs in middleware, so if it ever
 * threw, every request — pages included — would fail with it. A limiter that can't count (Redis
 * down, quota exhausted) must let the request through rather than block the whole app.
 */
export async function enforceGlobalApiLimit(key: string): Promise<NextResponse | null> {
  try {
    return await enforceRateLimit(`global:${key}`, GLOBAL_API_LIMIT, GLOBAL_API_WINDOW_MS);
  } catch {
    return null;
  }
}
