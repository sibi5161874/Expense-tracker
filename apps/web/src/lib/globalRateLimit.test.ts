import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/rateLimit', () => ({
  enforceRateLimit: vi.fn(),
}));

import { enforceRateLimit } from '@/lib/rateLimit';
import { enforceGlobalApiLimit, isGloballyRateLimitedPath, GLOBAL_API_LIMIT } from '@/lib/globalRateLimit';

describe('isGloballyRateLimitedPath', () => {
  it.each([
    '/api/prices/refresh',
    '/api/mf/search',
    '/api/import/bank-statement',
    '/api/live-price/universal',
    '/api/fx-rates',
  ])('limits %s', (path) => {
    expect(isGloballyRateLimitedPath(path)).toBe(true);
  });

  it.each(['/dashboard', '/portfolio', '/', '/login', '/_next/static/chunk.js'])('never limits the page %s', (path) => {
    expect(isGloballyRateLimitedPath(path)).toBe(false);
  });

  it('exempts the payment webhook and cron, which are server-to-server', () => {
    expect(isGloballyRateLimitedPath('/api/payments/webhook')).toBe(false);
    expect(isGloballyRateLimitedPath('/api/cron/monthly-summary')).toBe(false);
  });
});

describe('enforceGlobalApiLimit', () => {
  it('passes the key and the 100/min budget to the shared limiter', async () => {
    vi.mocked(enforceRateLimit).mockResolvedValueOnce(null);
    await expect(enforceGlobalApiLimit('user-1')).resolves.toBeNull();
    expect(enforceRateLimit).toHaveBeenCalledWith('global:user-1', GLOBAL_API_LIMIT, 60_000);
  });

  it('returns the limiter\'s 429 response when over budget', async () => {
    const tooMany = new Response(null, { status: 429 });
    vi.mocked(enforceRateLimit).mockResolvedValueOnce(tooMany as never);
    await expect(enforceGlobalApiLimit('user-2')).resolves.toBe(tooMany);
  });

  it('fails open when the limiter itself throws — a broken limiter must not take down every request', async () => {
    vi.mocked(enforceRateLimit).mockRejectedValueOnce(new Error('redis down'));
    await expect(enforceGlobalApiLimit('user-3')).resolves.toBeNull();
  });
});
