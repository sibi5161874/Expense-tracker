import { NextResponse } from 'next/server';

/**
 * In-memory fixed-window rate limiter. This is basic abuse protection for a
 * single-instance / early-launch deployment — it resets on cold start and
 * doesn't share state across serverless instances, so it's not a hard
 * guarantee once you're running multiple instances. Swap the Map below for
 * Upstash/Vercel KV behind the same `enforceRateLimit` signature if that ever
 * matters; every call site stays the same.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Call right after an API route resolves `user.id`, before doing any real
 * work. Returns a 429 response to return immediately, or `null` to continue.
 *
 * `key` should include both the user and the route (e.g. `import:${user.id}`)
 * so limits are per-user-per-route, not a single global counter.
 */
export function enforceRateLimit(key: string, limit: number, windowMs: number): NextResponse | null {
  const result = checkRateLimit(key, limit, windowMs);
  if (result.allowed) return null;
  return NextResponse.json(
    { error: 'Too many requests — please wait a moment and try again.' },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
  );
}
