import { NextResponse } from 'next/server';
import { resolveRequestUser } from '@/lib/supabase/bearer';
import { fetchYahooQuoteSummary } from '@/lib/yahooFinance';
import { getCachedQuote, setCachedQuote } from '@/lib/quoteCache';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import {
  resolveEffectiveTier,
  hasFeatureAccess,
  extractStockFundamentals,
  toYahooTicker,
  type StockFundamentals,
} from '@repo/shared/logic';
import { getUserProfile } from '@repo/shared/queries/profile';

// price is requested too (per spec) even though nothing here reads it yet — summaryDetail
// alone covers every field the fundamentals card and passive-income widget use today, but
// price/assetProfile keep the response forward-compatible with a company-profile section
// without a second round trip to Yahoo later.
const MODULES = 'summaryDetail,assetProfile,price';

/**
 * Stock fundamentals (P/E, 52-week range, margins, market cap, beta, dividend yield) for one
 * ticker — the data source behind both the fundamentals card on a holding's detail page and
 * the dashboard's passive-income projection. Same gate/cache/rate-limit shape as the
 * live-price routes; this is a distinct endpoint because quoteSummary's response shape has
 * nothing in common with the chart endpoint's.
 */
export async function GET(req: Request) {
  const { supabase, user } = await resolveRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const profile = await getUserProfile(supabase, user.id);
  const tier = resolveEffectiveTier(profile);
  if (!hasFeatureAccess('livePriceRefresh', tier)) {
    return NextResponse.json({ error: 'Stock fundamentals are a Pro feature.' }, { status: 403 });
  }

  const limited = await enforceRateLimit(`stock:fundamentals:${user.id}`, 60, 10 * 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker')?.trim().toUpperCase();
  if (!ticker) {
    return NextResponse.json({ error: 'Missing ticker' }, { status: 400 });
  }
  // Indian listings need the .NS/.BO suffix or Yahoo can't resolve them at all — same
  // symbol->Yahoo-ticker mapping /api/prices/refresh already uses, so a bare "SBIN" and a
  // properly-suffixed "SBIN.NS" don't silently diverge into two different code paths.
  const exchange = searchParams.get('exchange')?.trim() ?? '';
  const yahooTicker = toYahooTicker(ticker, exchange);

  const cacheKey = `fundamentals:${yahooTicker}`;
  const cached = await getCachedQuote<StockFundamentals>(cacheKey);
  if (cached) {
    return NextResponse.json({ ticker, ...cached });
  }

  try {
    const payload = await fetchYahooQuoteSummary(yahooTicker, MODULES);
    const fundamentals = extractStockFundamentals(payload);
    if (!fundamentals) {
      return NextResponse.json({ error: `No fundamentals available for "${ticker}".` }, { status: 404 });
    }

    await setCachedQuote(cacheKey, fundamentals);
    return NextResponse.json({ ticker, ...fundamentals });
  } catch (e) {
    logError('stock.fundamentals', e, { userId: user.id, ticker: yahooTicker, requestId: getRequestId(req) });
    return NextResponse.json({ error: "Couldn't fetch fundamentals right now, try again." }, { status: 502 });
  }
}
