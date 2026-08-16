/**
 * Live price refresh — pure parsing and matching logic.
 *
 * Network calls live in the API route; everything here is deterministic so the
 * matching rules (which decide what a user's portfolio is worth) are unit
 * testable without hitting a live endpoint.
 *
 * Two sources, chosen because both are free and need no API key:
 *  - Mutual funds: AMFI's official daily NAV file (semicolon-delimited).
 *  - Equity/ETF:   Yahoo Finance's chart endpoint, with .NS/.BO suffixes.
 *
 * Nothing here invents a price. A symbol that can't be matched is reported as
 * unmatched and its stored price is left alone — a stale price the user entered
 * is strictly better than a confidently wrong one from a bad match.
 */

export interface AmfiNavRow {
  schemeCode: string;
  isinGrowth: string;
  isinReinvest: string;
  schemeName: string;
  nav: number;
  date: string;
}

/**
 * Parses AMFI's NAVAll.txt. The file interleaves fund-house header lines and
 * blank lines with data rows, so anything without the expected field count is
 * skipped rather than treated as an error.
 *
 * Layout: Scheme Code;ISIN Div Payout/Growth;ISIN Div Reinvestment;Scheme Name;NAV;Date
 */
export function parseAmfiNavFile(text: string): AmfiNavRow[] {
  const rows: AmfiNavRow[] = [];

  for (const line of text.split(/\r?\n/)) {
    const parts = line.split(';');
    // Header line is "Scheme Code;ISIN..." — skip it and any non-data line.
    if (parts.length < 6) continue;
    if (parts[0]?.trim().toLowerCase() === 'scheme code') continue;

    const schemeCode = (parts[0] ?? '').trim();
    const nav = Number((parts[4] ?? '').trim());
    if (!schemeCode || !Number.isFinite(nav) || nav <= 0) continue;

    rows.push({
      schemeCode,
      isinGrowth: (parts[1] ?? '').trim(),
      isinReinvest: (parts[2] ?? '').trim(),
      schemeName: (parts[3] ?? '').trim(),
      nav,
      date: (parts[parts.length - 1] ?? '').trim(),
    });
  }

  return rows;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Builds lookup indexes over AMFI rows. A user's stored `symbol` for a mutual
 * fund could be a scheme code, an ISIN, or the scheme name depending on how it
 * was entered or imported, so all three are indexed.
 */
export interface AmfiIndex {
  byCode: Map<string, number>;
  byIsin: Map<string, number>;
  byName: Map<string, number>;
}

/**
 * AMFI writes "-" (not an empty field) when a scheme has no ISIN for that
 * variant — over 10,000 rows in the live file do this. Indexing that literally
 * would make "-" a lookup key that resolves to whichever fund happened to be
 * parsed last, so placeholders are rejected here.
 */
function isRealIsin(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && v !== '-' && v !== 'N.A.';
}

export function buildAmfiIndex(rows: AmfiNavRow[]): AmfiIndex {
  const byCode = new Map<string, number>();
  const byIsin = new Map<string, number>();
  const byName = new Map<string, number>();

  for (const row of rows) {
    byCode.set(row.schemeCode, row.nav);
    if (isRealIsin(row.isinGrowth)) byIsin.set(row.isinGrowth.trim().toUpperCase(), row.nav);
    if (isRealIsin(row.isinReinvest)) byIsin.set(row.isinReinvest.trim().toUpperCase(), row.nav);
    if (row.schemeName) byName.set(normalizeName(row.schemeName), row.nav);
  }

  return { byCode, byIsin, byName };
}

/** Exact-match only: scheme code, then ISIN, then normalized scheme name. */
export function lookupMutualFundNav(index: AmfiIndex, symbol: string): number | null {
  const raw = symbol.trim();
  if (!raw) return null;

  return index.byCode.get(raw) ?? index.byIsin.get(raw.toUpperCase()) ?? index.byName.get(normalizeName(raw)) ?? null;
}

/**
 * Maps a stored symbol + exchange to a Yahoo Finance ticker.
 * Indian listings need a suffix: .NS for NSE, .BO for BSE. A symbol that already
 * carries a suffix is passed through so pre-formatted entries still work.
 */
export function toYahooTicker(symbol: string, exchange: string): string {
  const clean = symbol.trim().toUpperCase();
  if (/\.(NS|BO)$/.test(clean)) return clean;

  const ex = exchange.trim().toUpperCase();
  if (ex === 'BSE') return `${clean}.BO`;
  if (ex === 'NSE') return `${clean}.NS`;
  // Non-Indian exchanges (US listings via Vested/Stockal) use the bare symbol.
  return clean;
}

/** Extracts the current price from Yahoo's chart response, tolerating its optional fields. */
export function extractYahooPrice(payload: unknown): number | null {
  const result = (payload as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: unknown } }> } })?.chart
    ?.result?.[0];
  const price = result?.meta?.regularMarketPrice;
  return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : null;
}

export interface PriceRefreshTarget {
  symbol: string;
  exchange: string;
  assetType: string;
}

export interface PriceRefreshOutcome {
  symbol: string;
  price: number | null;
  source: 'amfi' | 'yahoo' | 'unmatched';
}

export interface PriceRefreshSummary {
  updated: PriceRefreshOutcome[];
  unmatched: string[];
}

/** Mutual funds resolve from AMFI; everything else is treated as a quotable listing. */
export function isMutualFund(assetType: string): boolean {
  return assetType.trim().toLowerCase() === 'mutual fund';
}

/**
 * Assembles the final outcome list from the two resolved sources. Kept separate
 * from fetching so the merge rules — including "leave it alone if unmatched" —
 * are testable without network access.
 */
export function buildRefreshSummary(
  targets: PriceRefreshTarget[],
  amfiPrices: Record<string, number | null>,
  quotePrices: Record<string, number | null>
): PriceRefreshSummary {
  const updated: PriceRefreshOutcome[] = [];
  const unmatched: string[] = [];

  for (const target of targets) {
    // Sources are strictly partitioned by asset type — a mutual fund resolves
    // ONLY from AMFI, never from the quote feed. Falling back would let a scheme
    // code (e.g. "119551") or a fund name collide with an unrelated listed
    // ticker and silently price the holding off the wrong instrument.
    const fund = isMutualFund(target.assetType);
    const price = fund ? (amfiPrices[target.symbol] ?? null) : (quotePrices[target.symbol] ?? null);

    if (price === null) {
      unmatched.push(target.symbol);
      updated.push({ symbol: target.symbol, price: null, source: 'unmatched' });
      continue;
    }

    updated.push({ symbol: target.symbol, price, source: fund ? 'amfi' : 'yahoo' });
  }

  return { updated, unmatched };
}
