import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { enforceRateLimit } from '@/lib/rateLimit';
import { fetchYahooChart } from '@/lib/yahooFinance';
import { fetchCoinGeckoUsdPrice } from '@/lib/coinGecko';
import { getAmfiSchemes } from '@/lib/amfiCache';
import { getCachedQuotes, setCachedQuote } from '@/lib/quoteCache';
import { MF_NAV_TTL_SECONDS, QUOTE_TTL_SECONDS } from '@/lib/cacheTtls';
import {
  buildAmfiIndex,
  lookupMutualFundScheme,
  isAmbiguousMutualFundName,
  toYahooTicker,
  extractYahooPrice,
  extractYahooCurrency,
  normalizeQuoteCurrency,
  isMutualFund,
  type PriceRefreshTarget,
} from '@repo/shared/logic';
import { getAllInvestmentLog } from '@repo/shared/queries/investmentLog';
import { upsertHoldingPrices, type HoldingPriceUpdate } from '@repo/shared/queries/holdings';

/**
 * Live price refresh for the caller's holdings.
 *
 * Supersedes the `supabase/functions/refresh-prices` Edge Function, which only
 * covered Stock/ETF. Moving it here adds mutual-fund NAVs (usually the largest
 * slice of an Indian portfolio) and lets the matching rules live in
 * `packages/shared/logic/priceRefresh.ts` where they are unit tested — the Deno
 * Edge runtime can't import from the workspace package, so that logic would
 * otherwise have to be duplicated untested.
 *
 * Sources (both free, no API key):
 *  - Mutual funds: AMFI's official daily NAV file, one request for all funds.
 *  - Stock/ETF:    Yahoo Finance's chart endpoint, one request per symbol.
 *
 * Every price is cached globally (quoteCache.ts) — a ticker one user refreshed is a cache hit for
 * everyone else for QUOTE_TTL_SECONDS (funds: MF_NAV_TTL_SECONDS), and when every fund is cached
 * the AMFI file isn't downloaded at all. Public market data only, never anything per-user.
 *
 * Server-side because Yahoo doesn't allow direct browser fetches (CORS), not to
 * hide a secret — there is no key involved.
 */

/** Cap concurrent quote requests so a large portfolio doesn't hammer Yahoo. */
const QUOTE_CONCURRENCY = 5;

/** Response shape is unchanged from the Edge Function so existing callers keep working. */
interface RefreshResult {
  updated: string[];
  failed: string[];
  failedReasons: Record<string, string>;
  message?: string;
}

interface CachedListedQuote {
  price: number;
  currency: string | null;
}

interface CachedFundNav {
  nav: number;
  name: string;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = await enforceRateLimit(`prices:refresh:${user.id}`, 1, 60_000);
  if (limited) return limited;

  const investments = await getAllInvestmentLog(supabase, user.id);

  // One target per distinct symbol — duplicates would multiply outbound requests.
  const seen = new Map<string, PriceRefreshTarget>();
  for (const inv of investments ?? []) {
    if (!seen.has(inv.symbol)) {
      seen.set(inv.symbol, { symbol: inv.symbol, exchange: inv.exchange, assetType: inv.asset_type });
    }
  }
  const targets = [...seen.values()];

  if (targets.length === 0) {
    const empty: RefreshResult = { updated: [], failed: [], failedReasons: {}, message: 'No holdings to refresh.' };
    return NextResponse.json(empty);
  }

  const priced: HoldingPriceUpdate[] = [];
  const failed: string[] = [];
  const failedReasons: Record<string, string> = {};

  const funds = targets.filter((t) => isMutualFund(t.assetType));
  const listed = targets.filter((t) => !isMutualFund(t.assetType));

  // --- Mutual funds: shared cache first, then one AMFI load covers every miss ---
  if (funds.length > 0) {
    const fundKey = (symbol: string) => `nav:${symbol.trim().toLowerCase()}`;
    const cachedFunds = await getCachedQuotes<CachedFundNav>(funds.map((f) => fundKey(f.symbol)));
    const missing: PriceRefreshTarget[] = [];
    for (const fund of funds) {
      const hit = cachedFunds.get(fundKey(fund.symbol));
      if (hit) priced.push({ symbol: fund.symbol, live_price: hit.nav, live_currency: 'INR', display_name: hit.name });
      else missing.push(fund);
    }

    if (missing.length > 0) {
      try {
        const index = buildAmfiIndex(await getAmfiSchemes());

        for (const fund of missing) {
          const scheme = lookupMutualFundScheme(index, fund.symbol);
          if (scheme === null) {
            failed.push(fund.symbol);
            failedReasons[fund.symbol] = isAmbiguousMutualFundName(index, fund.symbol)
              ? 'This fund name is shared by several schemes (Direct/Regular, Growth/IDCW) — use the scheme code or ISIN instead.'
              : 'Not found in AMFI NAV data — pick the fund from the list when adding it, or use its scheme code or ISIN.';
            continue;
          }
          const name = [scheme.schemeName, scheme.plan, scheme.option].filter(Boolean).join(' - ');
          priced.push({ symbol: fund.symbol, live_price: scheme.nav, live_currency: 'INR', display_name: name });
          await setCachedQuote<CachedFundNav>(fundKey(fund.symbol), { nav: scheme.nav, name }, MF_NAV_TTL_SECONDS);
        }
      } catch (e) {
        // AMFI being down must not stop listed prices from refreshing.
        logError('prices.refresh.amfi', e, { userId: user.id, requestId: getRequestId(req) });
        const message = e instanceof Error ? e.message : String(e);
        for (const fund of missing) {
          failed.push(fund.symbol);
          failedReasons[fund.symbol] = `Couldn't fetch AMFI NAV data: ${message}`;
        }
      }
    }
  }

  // --- Stock/ETF/crypto: shared cache first, then one Yahoo request per miss, in small batches ---
  const tickerOf = (t: PriceRefreshTarget) => toYahooTicker(t.symbol, t.exchange, t.assetType);
  const listedKey = (t: PriceRefreshTarget) => `price:${tickerOf(t)}`;
  const cachedListed = await getCachedQuotes<CachedListedQuote>(listed.map(listedKey));
  const toFetch: PriceRefreshTarget[] = [];
  for (const target of listed) {
    const hit = cachedListed.get(listedKey(target));
    if (hit) priced.push({ symbol: target.symbol, live_price: hit.price, live_currency: hit.currency });
    else toFetch.push(target);
  }

  for (let i = 0; i < toFetch.length; i += QUOTE_CONCURRENCY) {
    const batch = toFetch.slice(i, i + QUOTE_CONCURRENCY);
    await Promise.all(
      batch.map(async (target) => {
        const ticker = tickerOf(target);
        try {
          const body = await fetchYahooChart(ticker, 'interval=1d&range=1d');
          const rawPrice = extractYahooPrice(body);
          if (rawPrice === null) throw new Error(`No usable price in the response for ${ticker}`);

          // Pence-quoted exchanges (London) are converted to the major currency here.
          const quote = normalizeQuoteCurrency(rawPrice, extractYahooCurrency(body));
          priced.push({ symbol: target.symbol, live_price: quote.price, live_currency: quote.currency });
          await setCachedQuote<CachedListedQuote>(
            listedKey(target),
            { price: quote.price, currency: quote.currency },
            QUOTE_TTL_SECONDS
          );
        } catch (e) {
          // Crypto only: CoinGecko is the fallback, in USD so it matches Yahoo's BTC-USD quote.
          // Any other asset class has no second source and just fails.
          if (target.assetType.trim().toLowerCase() === 'crypto') {
            try {
              const price = await fetchCoinGeckoUsdPrice(target.symbol);
              if (price !== null) {
                priced.push({ symbol: target.symbol, live_price: price, live_currency: 'USD' });
                await setCachedQuote<CachedListedQuote>(
                  listedKey(target),
                  { price, currency: 'USD' },
                  QUOTE_TTL_SECONDS
                );
                return;
              }
            } catch {
              // fall through to the original Yahoo failure below
            }
          }
          failed.push(target.symbol);
          failedReasons[target.symbol] = e instanceof Error ? e.message : String(e);
        }
      })
    );
  }

  // Failed symbols are simply not upserted — their existing price is left alone,
  // which is safer than overwriting a good manual price with a bad guess.
  try {
    await upsertHoldingPrices(supabase, user.id, priced);
  } catch (e) {
    logError('prices.refresh.upsert', e, { userId: user.id, requestId: getRequestId(req) });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to save refreshed prices.' },
      { status: 500 }
    );
  }

  const result: RefreshResult = {
    updated: priced.map((p) => p.symbol),
    failed,
    failedReasons,
  };
  return NextResponse.json(result);
}
