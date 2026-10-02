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
  // Expired buckets are otherwise only replaced when the same key returns; with a per-user/IP
  // global limiter that would grow without bound, so sweep them once the map gets large.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
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
  let redisCount: number | null;
  try {
    redisCount = await kvIncrWithExpiry(`ratelimit:${key}`, windowSeconds);
  } catch {
    // Redis erroring (quota exhausted, network blip) must degrade to the per-instance limiter, not
    // throw — otherwise every rate-limited route, and the global /api limiter in middleware, would
    // start failing the moment Upstash does.
    redisCount = null;
  }
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
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  message = 'Too many requests — please wait a moment and try again.'
): Promise<NextResponse | null> {
  const result = await checkRateLimit(key, limit, windowMs);
  if (result.allowed) return null;
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
  );
}

/** New imports allowed per user per hour, counted on each file's *preview* request only. A single
 * import is many requests (it commits in 200-row batches), so capping requests at 5 would block any
 * file over ~800 rows; capping previews limits how often imports can be *started* while the
 * existing per-route 500/hour request cap still bounds the batches. */
export const IMPORT_PREVIEWS_PER_HOUR = 5;

export function enforceImportPreviewLimit(importName: string, userId: string): Promise<NextResponse | null> {
  return enforceRateLimit(
    `import:${importName}:preview:${userId}`,
    IMPORT_PREVIEWS_PER_HOUR,
    60 * 60_000,
    `You can start ${IMPORT_PREVIEWS_PER_HOUR} imports per hour — please try again later.`
  );
}
