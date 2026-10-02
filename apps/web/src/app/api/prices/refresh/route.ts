import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { enforceRateLimit } from '@/lib/rateLimit';
import { fetchYahooChart } from '@/lib/yahooFinance';
import { fetchCoinGeckoUsdPrice } from '@/lib/coinGecko';
import { createResilientFetcher } from '@/lib/fetchWithRetry';
import {
  parseAmfiNavFile,
  buildAmfiIndex,
  lookupMutualFundNav,
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
 * Server-side because Yahoo doesn't allow direct browser fetches (CORS), not to
 * hide a secret — there is no key involved.
 */

// Live host as of Aug 2026. www.amfiindia.com now 302s here; using the final URL
// directly avoids relying on redirect-following.
const AMFI_NAV_URL = 'https://portal.amfiindia.com/spages/NAVAll.txt';

/** Cap concurrent quote requests so a large portfolio doesn't hammer Yahoo. */
const QUOTE_CONCURRENCY = 5;

/** Response shape is unchanged from the Edge Function so existing callers keep working. */
interface RefreshResult {
  updated: string[];
  failed: string[];
  failedReasons: Record<string, string>;
  message?: string;
}

/** Same retry/circuit-breaker mechanics as yahooFinance.ts, own independent instance — AMFI
 * is a single once-per-refresh request, so a transient timeout used to fail every mutual fund
 * in the batch immediately with no retry at all. */
const fetchAmfiResilient = createResilientFetcher({ label: 'AMFI', maxRetries: 3 });

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

  // --- Mutual funds: one AMFI request covers every fund ---
  if (funds.length > 0) {
    try {
      const res = await fetchAmfiResilient(AMFI_NAV_URL, 'NAV file');
      const navRows = parseAmfiNavFile(await res.text());
      // The live file has ~14,000 schemes; zero means AMFI changed the layout (it did once, adding
      // Plan/Option columns), not that every fund is missing — say so instead of blaming each symbol.
      if (navRows.length === 0) {
        throw new Error('AMFI NAV file parsed to 0 schemes — its layout has probably changed.');
      }
      const index = buildAmfiIndex(navRows);

      for (const fund of funds) {
        const nav = lookupMutualFundNav(index, fund.symbol);
        if (nav === null) {
          failed.push(fund.symbol);
          failedReasons[fund.symbol] = isAmbiguousMutualFundName(index, fund.symbol)
            ? 'This fund name is shared by several schemes (Direct/Regular, Growth/IDCW) — use the scheme code or ISIN instead.'
            : 'Not found in AMFI NAV data — the symbol must be the scheme code, ISIN, or the full scheme name including plan and option.';
          continue;
        }
        priced.push({ symbol: fund.symbol, live_price: nav, live_currency: 'INR' });
      }
    } catch (e) {
      // AMFI being down must not stop listed prices from refreshing.
      logError('prices.refresh.amfi', e, { userId: user.id, requestId: getRequestId(req) });
      const message = e instanceof Error ? e.message : String(e);
      for (const fund of funds) {
        failed.push(fund.symbol);
        failedReasons[fund.symbol] = `Couldn't fetch AMFI NAV data: ${message}`;
      }
    }
  }

  // --- Stock/ETF: one Yahoo request per symbol, in small batches ---
  for (let i = 0; i < listed.length; i += QUOTE_CONCURRENCY) {
    const batch = listed.slice(i, i + QUOTE_CONCURRENCY);
    await Promise.all(
      batch.map(async (target) => {
        const ticker = toYahooTicker(target.symbol, target.exchange, target.assetType);
        try {
          const body = await fetchYahooChart(ticker, 'interval=1d&range=1d');
          const rawPrice = extractYahooPrice(body);
          if (rawPrice === null) throw new Error(`No usable price in the response for ${ticker}`);

          // Pence-quoted exchanges (London) are converted to the major currency here.
          const quote = normalizeQuoteCurrency(rawPrice, extractYahooCurrency(body));
          priced.push({ symbol: target.symbol, live_price: quote.price, live_currency: quote.currency });
        } catch (e) {
          // Crypto only: CoinGecko is the fallback, in USD so it matches Yahoo's BTC-USD quote.
          // Any other asset class has no second source and just fails.
          if (target.assetType.trim().toLowerCase() === 'crypto') {
            try {
              const price = await fetchCoinGeckoUsdPrice(target.symbol);
              if (price !== null) {
                priced.push({ symbol: target.symbol, live_price: price, live_currency: 'USD' });
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
