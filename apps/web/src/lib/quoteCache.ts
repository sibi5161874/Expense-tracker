import { kvGet, kvMGet, kvSet } from '@/lib/kvStore';
import { QUOTE_TTL_SECONDS } from '@/lib/cacheTtls';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * Cache for public market-data lookups (live-price/universal, live-price/history,
 * stock/fundamentals, and prices/refresh's per-symbol quotes and fund NAVs) — keyed globally, not
 * per-user, since Yahoo's price for a ticker is the same for everyone, so one user's request
 * warms the cache for every other user asking about the same ticker.
 *
 * Backed by Redis (via kvStore.ts) when configured — real cross-instance caching, so a
 * ticker fetched on one serverless instance is a cache hit on every other instance too.
 * Falls back to the original in-memory `Map` otherwise. Acceptable either way because the
 * cached values are public market data, not anything user-specific — a cache miss just
 * means one extra upstream call, never a wrong answer.
 *
 * Best-effort by design: a Redis error (quota exhausted, network blip) is treated as a miss on
 * read and ignored on write, never thrown — a cache must not be able to take a route down.
 */
const cache = new Map<string, CacheEntry>();

function readMemory<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function getCachedQuote<T>(key: string): Promise<T | null> {
  try {
    const redisValue = await kvGet<T>(`quote:${key}`);
    if (redisValue !== null) return redisValue;
  } catch {
    // fall through to the in-memory copy
  }
  return readMemory<T>(key);
}

/** Batched read for many keys at once (one Redis round trip) — missing keys are simply absent. */
export async function getCachedQuotes<T>(keys: string[]): Promise<Map<string, T>> {
  const found = new Map<string, T>();
  if (keys.length === 0) return found;

  try {
    const values = await kvMGet<T>(keys.map((k) => `quote:${k}`));
    if (values) {
      keys.forEach((key, i) => {
        const v = values[i];
        if (v !== null && v !== undefined) found.set(key, v);
      });
    }
  } catch {
    // Redis unavailable — the in-memory pass below still serves what this instance has seen.
  }

  for (const key of keys) {
    if (found.has(key)) continue;
    const v = readMemory<T>(key);
    if (v !== null) found.set(key, v);
  }
  return found;
}

export async function setCachedQuote<T>(key: string, value: T, ttlSeconds: number = QUOTE_TTL_SECONDS): Promise<void> {
  cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  try {
    await kvSet(`quote:${key}`, value, ttlSeconds);
  } catch {
    // best-effort — the in-memory copy above still holds
  }
}
