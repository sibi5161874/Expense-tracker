import { Redis } from '@upstash/redis';

/**
 * Thin key-value abstraction shared by rateLimit.ts and quoteCache.ts. When
 * `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are set, both back onto real Redis —
 * genuinely shared state across every serverless instance. When they aren't, everything
 * here returns `null`/no-ops, and both callers fall back to their existing in-memory `Map`
 * behavior — nothing breaks without the env vars configured, and nothing here needs a
 * second code path in the callers to handle "Redis unavailable".
 */
let client: Redis | null | undefined;

export function isKvConfigured(): boolean {
  return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
}

function getClient(): Redis | null {
  if (client !== undefined) return client;
  client = isKvConfigured()
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
    : null;
  return client;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const redis = getClient();
  if (!redis) return null;
  return (await redis.get<T>(key)) ?? null;
}

export async function kvSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  await redis.set(key, value, { ex: ttlSeconds });
}

/**
 * Fixed-window counter: increments `key`, setting its expiry only on the first hit of the
 * window (matching the in-memory fallback's own fixed-window semantics in rateLimit.ts) so
 * a burst of increments mid-window doesn't keep pushing the window back out. Returns `null`
 * when Redis isn't configured, so the caller knows to use its in-memory path instead.
 */
export async function kvIncrWithExpiry(key: string, windowSeconds: number): Promise<number | null> {
  const redis = getClient();
  if (!redis) return null;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count;
}
