import { createResilientFetcher } from '@/lib/fetchWithRetry';

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_QUOTE_SUMMARY_URL = 'https://query1.finance.yahoo.com/v11/finance/quoteSummary';

/** Circuit trips after 5 consecutive failures across ALL tickers — Yahoo being down is a
 * single shared failure mode, not a per-ticker one, so the breaker is global rather than
 * keyed. Same retry/circuit-breaker mechanics as AMFI's fetcher in prices/refresh/route.ts,
 * but its own independent instance — Yahoo failing must not trip AMFI's circuit or vice versa. */
const fetchYahooResilient = createResilientFetcher({ label: 'Yahoo Finance' });

/**
 * Fetches Yahoo Finance's chart endpoint for one ticker with a hard timeout — the endpoint
 * is free and needs no key, but it's also unofficial and undocumented, so a hung request
 * must not hang the route indefinitely. Shared by both /api/live-price routes and
 * /api/prices/refresh's Stock/ETF branch.
 */
export async function fetchYahooChart(ticker: string, queryParams: string): Promise<unknown> {
  const res = await fetchYahooResilient(`${YAHOO_CHART_URL}/${encodeURIComponent(ticker)}?${queryParams}`, ticker);
  return res.json();
}

/** Fetches Yahoo's quoteSummary endpoint (fundamentals: P/E, margins, dividend yield, ...) for one ticker with the given comma-separated module list. Same timeout/retry/circuit-breaker as fetchYahooChart, different endpoint shape. */
export async function fetchYahooQuoteSummary(ticker: string, modules: string): Promise<unknown> {
  const res = await fetchYahooResilient(
    `${YAHOO_QUOTE_SUMMARY_URL}/${encodeURIComponent(ticker)}?modules=${modules}`,
    ticker
  );
  return res.json();
}
