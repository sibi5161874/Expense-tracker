import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logger';
import {
  parseAmfiNavFile,
  buildAmfiIndex,
  lookupMutualFundNav,
  toYahooTicker,
  extractYahooPrice,
  isMutualFund,
  type PriceRefreshTarget,
} from '@repo/shared/logic';
import { getAllInvestmentLog } from '@repo/shared/queries/investmentLog';
import { getHoldings, upsertHoldingPrices } from '@repo/shared/queries/holdings';

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
const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

const REQUEST_TIMEOUT_MS = 10_000;
/** Cap concurrent quote requests so a large portfolio doesn't hammer Yahoo. */
const QUOTE_CONCURRENCY = 5;
/** Carried over from the Edge Function it replaces. */
const RATE_LIMIT_SECONDS = 60;

/** Response shape is unchanged from the Edge Function so existing callers keep working. */
interface RefreshResult {
  updated: string[];
  failed: string[];
  failedReasons: Record<string, string>;
  message?: string;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { headers: FETCH_HEADERS, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Rate limit off the most recent holdings write, same rule as the Edge Function.
  const existingHoldings = await getHoldings(supabase, user.id);
  const mostRecent = (existingHoldings ?? []).reduce<string | null>(
    (latest, h) => (latest === null || h.updated_at > latest ? h.updated_at : latest),
    null
  );
  if (mostRecent) {
    const secondsSince = (Date.now() - new Date(mostRecent).getTime()) / 1000;
    if (secondsSince < RATE_LIMIT_SECONDS) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil(RATE_LIMIT_SECONDS - secondsSince)}s before refreshing again.` },
        { status: 429 }
      );
    }
  }

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

  const priced: { symbol: string; live_price: number }[] = [];
  const failed: string[] = [];
  const failedReasons: Record<string, string> = {};

  const funds = targets.filter((t) => isMutualFund(t.assetType));
  const listed = targets.filter((t) => !isMutualFund(t.assetType));

  // --- Mutual funds: one AMFI request covers every fund ---
  if (funds.length > 0) {
    try {
      const res = await fetchWithTimeout(AMFI_NAV_URL);
      if (!res.ok) throw new Error(`AMFI returned HTTP ${res.status}`);
      const index = buildAmfiIndex(parseAmfiNavFile(await res.text()));

      for (const fund of funds) {
        const nav = lookupMutualFundNav(index, fund.symbol);
        if (nav === null) {
          failed.push(fund.symbol);
          failedReasons[fund.symbol] =
            'Not found in AMFI NAV data — the symbol must be the scheme code, ISIN, or exact scheme name.';
          continue;
        }
        priced.push({ symbol: fund.symbol, live_price: nav });
      }
    } catch (e) {
      // AMFI being down must not stop listed prices from refreshing.
      logError('prices.refresh.amfi', e, { userId: user.id });
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
        const ticker = toYahooTicker(target.symbol, target.exchange);
        try {
          const res = await fetchWithTimeout(`${YAHOO_CHART_URL}/${encodeURIComponent(ticker)}?interval=1d&range=1d`);
          if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${ticker}`);

          const body = await res.json();
          const price = extractYahooPrice(body);
          if (price === null) throw new Error(`No usable price in the response for ${ticker}`);

          priced.push({ symbol: target.symbol, live_price: price });
        } catch (e) {
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
    logError('prices.refresh.upsert', e, { userId: user.id });
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
