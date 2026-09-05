import { NextResponse } from 'next/server';
import { resolveRequestUser } from '@/lib/supabase/bearer';
import { fetchYahooChart } from '@/lib/yahooFinance';
import { getCachedQuote, setCachedQuote } from '@/lib/quoteCache';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { resolveEffectiveTier, hasFeatureAccess, extractYahooQuote, type YahooQuote } from '@repo/shared/logic';
import { getUserProfile } from '@repo/shared/queries/profile';

/**
 * Live price lookup for any ticker, not just ones already in the user's portfolio (that's
 * /api/prices/refresh, which only ever refreshes owned holdings). Reuses the same Yahoo
 * chart endpoint and quote-shape parsing, gated the same way, but this one takes an
 * arbitrary symbol on demand — the backbone for anything that wants to show a live price
 * outside the portfolio itself (a watchlist, a benchmark, etc).
 */
export async function GET(req: Request) {
  const { supabase, user } = await resolveRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const profile = await getUserProfile(supabase, user.id);
  const tier = resolveEffectiveTier(profile);
  if (!hasFeatureAccess('livePriceRefresh', tier)) {
    return NextResponse.json({ error: 'Live prices are a Pro feature.' }, { status: 403 });
  }

  const limited = await enforceRateLimit(`live-price:universal:${user.id}`, 60, 10 * 60_000);
  if (limited) return limited;

  const ticker = new URL(req.url).searchParams.get('ticker')?.trim().toUpperCase();
  if (!ticker) {
    return NextResponse.json({ error: 'Missing ticker' }, { status: 400 });
  }

  const cacheKey = `quote:${ticker}`;
  const cached = await getCachedQuote<YahooQuote>(cacheKey);
  if (cached) {
    return NextResponse.json({ ticker, price: cached.price, currency: cached.currency });
  }

  try {
    const payload = await fetchYahooChart(ticker, 'interval=1d&range=1d');
    const quote = extractYahooQuote(payload);
    if (!quote) {
      return NextResponse.json({ error: `No price available for "${ticker}".` }, { status: 404 });
    }

    await setCachedQuote(cacheKey, quote);
    return NextResponse.json({ ticker, price: quote.price, currency: quote.currency });
  } catch (e) {
    logError('live-price.universal', e, { userId: user.id, ticker, requestId: getRequestId(req) });
    return NextResponse.json({ error: "Couldn't fetch a price right now, try again." }, { status: 502 });
  }
}
