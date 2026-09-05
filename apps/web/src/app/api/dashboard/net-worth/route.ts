import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { enforceRateLimit } from '@/lib/rateLimit';
import { kvGet, kvSet } from '@/lib/kvStore';
import { computeUserNetWorth } from '@/lib/computeUserNetWorth';
import type { FxRates } from '@repo/shared/logic';

/**
 * Server-cached net worth for the dashboard hero — previously the dashboard composed 15
 * separate client-side Supabase queries (one per asset table) on every single visit, with
 * only React Query's 30s client-side staleTime softening repeat loads within one browser tab.
 * That meant a fresh tab, a different device, or staleTime simply expiring all cost a cold
 * 15-query hit against Postgres for a number that doesn't change from second to second.
 *
 * This reuses computeUserNetWorth (already existed for the monthly-email cron) behind a short
 * Redis-backed cache. The TTL intentionally matches the client's own staleTime — this cache
 * can never make the dashboard look staler than it already tolerated before this existed.
 */
const CACHE_TTL_SECONDS = 30;
const FX_CACHE_KEY = 'fx:rates';

interface CachedFxEntry {
  rates: FxRates;
  fetchedAt: string;
}

async function resolveFxRates(): Promise<FxRates> {
  // Reuses whatever /api/fx-rates last cached rather than fetching a second time — if that
  // cache is cold, an empty rates object degrades the same way useFxRates already handles
  // client-side: only INR-denominated accounts convert, foreign ones are reported as unconverted.
  const cached = await kvGet<CachedFxEntry>(FX_CACHE_KEY);
  return cached?.rates ?? {};
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = await enforceRateLimit(`dashboard:net-worth:${user.id}`, 30, 60_000);
  if (limited) return limited;

  const cacheKey = `netWorth:${user.id}`;
  const cached = await kvGet<{ data: unknown; unconvertedCurrencies: string[]; cachedAt: string }>(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, cacheHit: true });
  }

  try {
    const fxRates = await resolveFxRates();
    const { unconvertedCurrencies, ...data } = await computeUserNetWorth(supabase, user.id, fxRates);
    const entry = { data, unconvertedCurrencies, cachedAt: new Date().toISOString() };
    await kvSet(cacheKey, entry, CACHE_TTL_SECONDS);
    return NextResponse.json({ ...entry, cacheHit: false });
  } catch (e) {
    logError('dashboard.netWorth', e, { userId: user.id, requestId: getRequestId(req) });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to compute net worth.' },
      { status: 500 }
    );
  }
}
