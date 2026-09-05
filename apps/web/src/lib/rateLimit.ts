import { NextResponse } from 'next/server';
import { kvIncrWithExpiry } from '@/lib/kvStore';

/**
 * Fixed-window rate limiter. Backed by Redis (via kvStore.ts) when `UPSTASH_REDIS_REST_URL`/
 * `UPSTASH_REDIS_REST_TOKEN` are configured — genuinely shared state across every
 * serverless instance, closing the gap the in-memory fallback below has always had. Without
 * those env vars set, falls back to the original in-memory `Map`: resets on cold start,
 * not shared across instances, acceptable for an early-launch single-instance deployment
 * but not a hard guarantee beyond that. Every call site stays exactly the same either way.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

function checkInMemory(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSeconds: number } {
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

async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const windowSeconds = Math.ceil(windowMs / 1000);
  const redisCount = await kvIncrWithExpiry(`ratelimit:${key}`, windowSeconds);
  if (redisCount === null) {
    return checkInMemory(key, limit, windowMs);
  }
  if (redisCount > limit) {
    // Approximate — Redis's own TTL is the source of truth for when this key expires, but
    // reading it back would be a second round trip for a number this endpoint only shows as
    // a hint anyway (RULES.md doesn't promise Retry-After is exact, only useful).
    return { allowed: false, retryAfterSeconds: windowSeconds };
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
export async function enforceRateLimit(key: string, limit: number, windowMs: number): Promise<NextResponse | null> {
  const result = await checkRateLimit(key, limit, windowMs);
  if (result.allowed) return null;
  return NextResponse.json(
    { error: 'Too many requests — please wait a moment and try again.' },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
  );
}
