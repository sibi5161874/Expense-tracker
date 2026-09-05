import { kvGet, kvSet } from '@/lib/kvStore';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_TTL_SECONDS = CACHE_TTL_MS / 1000;

interface CacheEntry {
  value: unknown;
  cachedAt: number;
}

/**
 * Cache for public market-data lookups (live-price/universal, live-price/history,
 * stock/fundamentals) — keyed globally, not per-user, since Yahoo's price for a ticker is
 * the same for everyone, so one user's request warms the cache for every other user asking
 * about the same ticker.
 *
 * Backed by Redis (via kvStore.ts) when configured — real cross-instance caching, so a
 * ticker fetched on one serverless instance is a cache hit on every other instance too.
 * Falls back to the original in-memory `Map` otherwise. Acceptable either way because the
 * cached values are public market data, not anything user-specific — a cache miss just
 * means one extra Yahoo call, never a wrong answer.
 */
const cache = new Map<string, CacheEntry>();

export async function getCachedQuote<T>(key: string): Promise<T | null> {
  const redisValue = await kvGet<T>(`quote:${key}`);
  if (redisValue !== null) return redisValue;

  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function setCachedQuote<T>(key: string, value: T): Promise<void> {
  await kvSet(`quote:${key}`, value, CACHE_TTL_SECONDS);
  cache.set(key, { value, cachedAt: Date.now() });
}
