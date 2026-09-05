import { NextResponse } from 'next/server';
import { resolveRequestUser } from '@/lib/supabase/bearer';
import { fetchYahooChart } from '@/lib/yahooFinance';
import { getCachedQuote, setCachedQuote } from '@/lib/quoteCache';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import {
  resolveEffectiveTier,
  hasFeatureAccess,
  extractYahooHistory,
  type YahooHistoryPoint,
} from '@repo/shared/logic';
import { getUserProfile } from '@repo/shared/queries/profile';

const RANGES = ['1mo', '3mo', '6mo', '1y'] as const;
type Range = (typeof RANGES)[number];

function isRange(value: unknown): value is Range {
  return typeof value === 'string' && (RANGES as readonly string[]).includes(value);
}

/**
 * Daily closing-price history for a ticker (currently used for the Nifty 50 benchmark
 * overlay on the dashboard) — a distinct shape from live-price/universal's single current
 * quote, so it gets its own route rather than a mode flag on that one.
 */
export async function GET(req: Request) {
  const { supabase, user } = await resolveRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const profile = await getUserProfile(supabase, user.id);
  const tier = resolveEffectiveTier(profile);
  if (!hasFeatureAccess('livePriceRefresh', tier)) {
    return NextResponse.json({ error: 'Live prices are a Pro feature.' }, { status: 403 });
  }

  const limited = await enforceRateLimit(`live-price:history:${user.id}`, 30, 10 * 60_000);
  if (limited) return limited;

  const url = new URL(req.url);
  const ticker = url.searchParams.get('ticker')?.trim().toUpperCase();
  const range = url.searchParams.get('range');
  if (!ticker) {
    return NextResponse.json({ error: 'Missing ticker' }, { status: 400 });
  }
  if (!isRange(range)) {
    return NextResponse.json({ error: `range must be one of: ${RANGES.join(', ')}` }, { status: 400 });
  }

  const cacheKey = `history:${ticker}:${range}`;
  const cached = await getCachedQuote<YahooHistoryPoint[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ ticker, range, points: cached });
  }

  try {
    const payload = await fetchYahooChart(ticker, `interval=1d&range=${range}`);
    const points = extractYahooHistory(payload);
    if (points.length === 0) {
      return NextResponse.json({ error: `No history available for "${ticker}".` }, { status: 404 });
    }

    await setCachedQuote(cacheKey, points);
    return NextResponse.json({ ticker, range, points });
  } catch (e) {
    logError('live-price.history', e, { userId: user.id, ticker, range, requestId: getRequestId(req) });
    return NextResponse.json({ error: "Couldn't fetch history right now, try again." }, { status: 502 });
  }
}
