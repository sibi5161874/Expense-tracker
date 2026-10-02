import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/kvStore', () => ({
  kvIncrWithExpiry: vi.fn(),
}));

import { kvIncrWithExpiry } from '@/lib/kvStore';
import { enforceImportPreviewLimit, enforceRateLimit, IMPORT_PREVIEWS_PER_HOUR } from '@/lib/rateLimit';

const incr = vi.mocked(kvIncrWithExpiry);

describe('enforceRateLimit', () => {
  // Braces matter: returning the mock from beforeEach makes Vitest call it as a teardown hook.
  beforeEach(() => {
    incr.mockReset();
  });

  it('allows requests up to the limit and rejects the next one (Redis counting)', async () => {
    incr.mockResolvedValueOnce(2).mockResolvedValueOnce(3);
    expect(await enforceRateLimit('t:redis', 2, 60_000)).toBeNull();
    const limited = await enforceRateLimit('t:redis', 2, 60_000);
    expect(limited?.status).toBe(429);
  });

  it('falls back to the in-memory limiter when Redis throws, instead of throwing itself', async () => {
    incr.mockRejectedValue(new Error('ERR max requests limit exceeded'));
    expect(await enforceRateLimit('t:fallback', 2, 60_000)).toBeNull();
    expect(await enforceRateLimit('t:fallback', 2, 60_000)).toBeNull();
    const limited = await enforceRateLimit('t:fallback', 2, 60_000);
    expect(limited?.status).toBe(429);
  });

  it('uses the in-memory limiter when Redis is not configured', async () => {
    incr.mockResolvedValue(null);
    expect(await enforceRateLimit('t:nokv', 1, 60_000)).toBeNull();
    expect((await enforceRateLimit('t:nokv', 1, 60_000))?.status).toBe(429);
  });

  it('uses a custom message when given one', async () => {
    incr.mockResolvedValue(99);
    const limited = await enforceRateLimit('t:msg', 1, 60_000, 'slow down');
    expect(await limited!.json()).toEqual({ error: 'slow down' });
  });
});

describe('enforceImportPreviewLimit', () => {
  beforeEach(() => {
    incr.mockReset();
  });

  it('allows 5 new imports per hour, per user and per import type, then explains why it stopped', async () => {
    incr.mockResolvedValue(null);
    for (let i = 0; i < IMPORT_PREVIEWS_PER_HOUR; i++) {
      expect(await enforceImportPreviewLimit('bank-statement', 'u1')).toBeNull();
    }
    const limited = await enforceImportPreviewLimit('bank-statement', 'u1');
    expect(limited?.status).toBe(429);
    expect((await limited!.json()).error).toMatch(/5 imports per hour/);

    // A different user, or a different kind of import, has its own allowance.
    expect(await enforceImportPreviewLimit('bank-statement', 'u2')).toBeNull();
    expect(await enforceImportPreviewLimit('cashbook', 'u1')).toBeNull();
  });
});
