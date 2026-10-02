import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/kvStore', () => ({
  kvGet: vi.fn(),
  kvMGet: vi.fn(),
  kvSet: vi.fn(),
}));

import { kvGet, kvMGet, kvSet } from '@/lib/kvStore';
import { getCachedQuote, getCachedQuotes, setCachedQuote } from '@/lib/quoteCache';
import { FX_TTL_SECONDS, MF_NAV_TTL_SECONDS, QUOTE_TTL_SECONDS } from '@/lib/cacheTtls';

describe('cache lifetimes', () => {
  it('are 6h for quotes, 12h for fund NAVs and 24h for FX', () => {
    expect(QUOTE_TTL_SECONDS).toBe(6 * 3600);
    expect(MF_NAV_TTL_SECONDS).toBe(12 * 3600);
    expect(FX_TTL_SECONDS).toBe(24 * 3600);
  });
});

describe('quoteCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(kvGet).mockReset().mockResolvedValue(null);
    vi.mocked(kvMGet).mockReset().mockResolvedValue(null);
    vi.mocked(kvSet).mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => vi.useRealTimers());

  it('writes to Redis with the TTL it was given, defaulting to the quote TTL', async () => {
    await setCachedQuote('a', { price: 1 });
    await setCachedQuote('b', { nav: 2 }, MF_NAV_TTL_SECONDS);
    expect(kvSet).toHaveBeenCalledWith('quote:a', { price: 1 }, QUOTE_TTL_SECONDS);
    expect(kvSet).toHaveBeenCalledWith('quote:b', { nav: 2 }, MF_NAV_TTL_SECONDS);
  });

  it('serves the in-memory copy until its own TTL runs out', async () => {
    await setCachedQuote('short', { v: 1 }, 60);
    expect(await getCachedQuote('short')).toEqual({ v: 1 });
    vi.advanceTimersByTime(61_000);
    expect(await getCachedQuote('short')).toBeNull();
  });

  it('treats a Redis read error as a miss and still serves memory — a cache must never throw', async () => {
    await setCachedQuote('k', { v: 1 });
    vi.mocked(kvGet).mockRejectedValue(new Error('quota'));
    expect(await getCachedQuote('k')).toEqual({ v: 1 });
  });

  it('ignores a Redis write error', async () => {
    vi.mocked(kvSet).mockRejectedValue(new Error('quota'));
    await expect(setCachedQuote('k2', { v: 2 })).resolves.toBeUndefined();
    expect(await getCachedQuote('k2')).toEqual({ v: 2 });
  });

  it('getCachedQuotes returns only the hits from one batched Redis read', async () => {
    vi.mocked(kvMGet).mockResolvedValue([{ price: 10 }, null, { price: 30 }]);
    const found = await getCachedQuotes<{ price: number }>(['x', 'y', 'z']);
    expect([...found.keys()]).toEqual(['x', 'z']);
    expect(found.get('z')).toEqual({ price: 30 });
    expect(kvMGet).toHaveBeenCalledWith(['quote:x', 'quote:y', 'quote:z']);
  });

  it('getCachedQuotes falls back to memory when Redis is unavailable or errors', async () => {
    await setCachedQuote('m1', { price: 5 });
    vi.mocked(kvMGet).mockRejectedValue(new Error('down'));
    const found = await getCachedQuotes<{ price: number }>(['m1', 'm2']);
    expect([...found.keys()]).toEqual(['m1']);
  });
});
