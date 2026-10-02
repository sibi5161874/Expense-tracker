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
  /** Only present in the current 8-column layout, where AMFI split these out of the name. */
  plan?: string;
  option?: string;
  nav: number;
  date: string;
}

/** Column positions for one AMFI file layout; `date: null` means "the last field". */
interface AmfiColumns {
  code: number;
  isinGrowth: number;
  isinReinvest: number;
  name: number;
  plan: number | null;
  option: number | null;
  nav: number;
  date: number | null;
}

/** The pre-2026 six-column layout, used when a file has no recognizable header line. */
const LEGACY_AMFI_COLUMNS: AmfiColumns = {
  code: 0,
  isinGrowth: 1,
  isinReinvest: 2,
  name: 3,
  plan: null,
  option: null,
  nav: 4,
  date: null,
};

/**
 * Maps a header line's column names to positions instead of hard-coding them. AMFI inserted
 * "Plan" and "Option" columns ahead of the NAV, which silently made a fixed-position parser read
 * "Direct Plan" as the NAV and reject every row — reading by name means the next layout change
 * either still works or yields zero rows (which the refresh route reports), never wrong fields.
 */
function resolveAmfiColumns(header: string[]): AmfiColumns | null {
  const names = header.map((h) => h.trim().toLowerCase());
  const find = (predicate: (n: string) => boolean) => {
    const i = names.findIndex(predicate);
    return i === -1 ? null : i;
  };

  const code = find((n) => n.startsWith('scheme code'));
  const name = find((n) => n === 'scheme name');
  const nav = find((n) => n.includes('net asset value'));
  const date = find((n) => n === 'date');
  const isinGrowth = find((n) => n.includes('isin') && (n.includes('growth') || n.includes('payout')));
  const isinReinvest = find((n) => n.includes('isin') && n.includes('reinvest'));
  if (code === null || name === null || nav === null || date === null) return null;

  return {
    code,
    name,
    nav,
    date,
    isinGrowth: isinGrowth ?? -1,
    isinReinvest: isinReinvest ?? -1,
    plan: find((n) => n === 'plan'),
    option: find((n) => n === 'option'),
  };
}

/**
 * Parses AMFI's NAVAll.txt. The file interleaves fund-house header lines and
 * blank lines with data rows, so anything without the expected field count is
 * skipped rather than treated as an error.
 *
 * Current layout: Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;
 * Plan;Option;Net Asset Value;Date. Columns are located from the header line; a file with no
 * header is read as the legacy six-column layout.
 */
export function parseAmfiNavFile(text: string): AmfiNavRow[] {
  const rows: AmfiNavRow[] = [];
  // Legacy positions apply only to a file with no header at all. A header we can't read means the
  // layout changed in a way we don't understand — better to yield nothing (the refresh route then
  // reports it) than to fall back to fixed positions and read the wrong fields.
  let columns: AmfiColumns | null = LEGACY_AMFI_COLUMNS;

  for (const line of text.split(/\r?\n/)) {
    const parts = line.split(';');
    if (parts.length < 6) continue;
    if (parts[0]?.trim().toLowerCase() === 'scheme code') {
      columns = resolveAmfiColumns(parts);
      continue;
    }
    if (!columns) continue;

    const cell = (i: number | null) => (i === null || i < 0 ? '' : (parts[i] ?? '').trim());
    const schemeCode = cell(columns.code);
    const nav = Number(cell(columns.nav));
    if (!schemeCode || !Number.isFinite(nav) || nav <= 0) continue;

    const plan = cell(columns.plan);
    const option = cell(columns.option);
    rows.push({
      schemeCode,
      isinGrowth: cell(columns.isinGrowth),
      isinReinvest: cell(columns.isinReinvest),
      schemeName: cell(columns.name),
      ...(columns.plan !== null ? { plan } : {}),
      ...(columns.option !== null ? { option } : {}),
      nav,
      date: columns.date === null ? (parts[parts.length - 1] ?? '').trim() : cell(columns.date),
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
  /** Normalized names shared by 2+ schemes (Direct/Regular x Growth/IDCW) — never matched. */
  ambiguousNames: Set<string>;
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
  const nameNavs = new Map<string, Set<number>>();
  const nameSchemes = new Map<string, Set<string>>();

  const addName = (key: string, schemeCode: string, nav: number) => {
    if (!key) return;
    if (!nameSchemes.has(key)) nameSchemes.set(key, new Set());
    nameSchemes.get(key)!.add(schemeCode);
    if (!nameNavs.has(key)) nameNavs.set(key, new Set());
    nameNavs.get(key)!.add(nav);
  };

  for (const row of rows) {
    byCode.set(row.schemeCode, row.nav);
    if (isRealIsin(row.isinGrowth)) byIsin.set(row.isinGrowth.trim().toUpperCase(), row.nav);
    if (isRealIsin(row.isinReinvest)) byIsin.set(row.isinReinvest.trim().toUpperCase(), row.nav);

    // Current layout: the name no longer says Direct/Regular or Growth/IDCW, so the full name a
    // user would type is name + plan + option ("Option" trimmed — "Growth Option" -> "Growth").
    if (row.plan !== undefined || row.option !== undefined) {
      const option = (row.option ?? '').replace(/\s+option$/i, '');
      addName(normalizeName(`${row.schemeName} ${row.plan ?? ''} ${option}`), row.schemeCode, row.nav);
    }
    addName(normalizeName(row.schemeName), row.schemeCode, row.nav);
  }

  // A name resolves only when exactly one scheme carries it. "Parag Parikh Flexi Cap Fund" alone
  // names four different schemes with four different NAVs — picking one would silently price a
  // Regular holding off the Direct plan (or an IDCW fund off Growth).
  const byName = new Map<string, number>();
  const ambiguousNames = new Set<string>();
  for (const [key, schemes] of nameSchemes) {
    if (schemes.size === 1) byName.set(key, [...nameNavs.get(key)!][0]!);
    else ambiguousNames.add(key);
  }

  return { byCode, byIsin, byName, ambiguousNames };
}

/** Exact-match only: scheme code, then ISIN, then a name that identifies exactly one scheme. */
export function lookupMutualFundNav(index: AmfiIndex, symbol: string): number | null {
  const raw = symbol.trim();
  if (!raw) return null;

  return index.byCode.get(raw) ?? index.byIsin.get(raw.toUpperCase()) ?? index.byName.get(normalizeName(raw)) ?? null;
}

/** True when `symbol` is a fund name that several schemes share — lets the caller say so. */
export function isAmbiguousMutualFundName(index: AmfiIndex, symbol: string): boolean {
  return index.ambiguousNames.has(normalizeName(symbol));
}

/**
 * Maps a stored symbol + exchange to a Yahoo Finance ticker.
 * Indian listings need a suffix: .NS for NSE, .BO for BSE. A symbol that already
 * carries a suffix is passed through so pre-formatted entries still work.
 */
export function toYahooTicker(symbol: string, exchange: string, assetType?: string): string {
  const clean = symbol.trim().toUpperCase();
  if (/\.(NS|BO)$/.test(clean)) return clean;

  // A bare crypto symbol on Yahoo is a different instrument ("BTC" is a Bitcoin ETF at ~$37, not
  // Bitcoin) — crypto pairs are written "BTC-USD". A symbol already containing a pair is kept.
  if (assetType?.trim().toLowerCase() === 'crypto' && !clean.includes('-')) return `${clean}-USD`;

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

export interface YahooQuote {
  price: number;
  currency: string;
}

/**
 * Extracts price + currency for the "any ticker" live price lookup (packages/shared has no
 * portfolio context here, unlike extractYahooPrice above which is matched against a known
 * holding) — a bare quote, so currency has to travel with it since the caller has no other
 * way to know what it's looking at.
 */
export function extractYahooQuote(payload: unknown): YahooQuote | null {
  const result = (
    payload as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: unknown; currency?: unknown } }> } }
  )?.chart?.result?.[0];
  const price = result?.meta?.regularMarketPrice;
  const currency = result?.meta?.currency;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return null;
  if (typeof currency !== 'string' || !currency) return null;
  return { price, currency };
}

/** The currency Yahoo reports for a quote, or null when it's absent. */
export function extractYahooCurrency(payload: unknown): string | null {
  const currency = (payload as { chart?: { result?: Array<{ meta?: { currency?: unknown } }> } })?.chart?.result?.[0]
    ?.meta?.currency;
  return typeof currency === 'string' && currency ? currency : null;
}

/**
 * Yahoo quotes some exchanges in a minor unit — London in pence ("GBp"/"GBX": 1438.2 means
 * £14.382), Johannesburg in cents ("ZAc"), Tel Aviv in agorot ("ILA"). Left alone, a London stock
 * would read 100x too high, so these are converted to the major currency.
 */
const MINOR_UNIT_CURRENCIES: Record<string, { currency: string; divisor: number }> = {
  GBp: { currency: 'GBP', divisor: 100 },
  GBX: { currency: 'GBP', divisor: 100 },
  ZAc: { currency: 'ZAR', divisor: 100 },
  ILA: { currency: 'ILS', divisor: 100 },
};

export function normalizeQuoteCurrency(
  price: number,
  currency: string | null
): { price: number; currency: string | null } {
  const minor = currency ? MINOR_UNIT_CURRENCIES[currency] : undefined;
  return minor ? { price: price / minor.divisor, currency: minor.currency } : { price, currency };
}

/** Crypto symbols CoinGecko can price, as the bare ticker a user would type. */
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  LTC: 'litecoin',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  TRX: 'tron',
  SHIB: 'shiba-inu',
  TON: 'the-open-network',
  XLM: 'stellar',
  ATOM: 'cosmos',
  USDT: 'tether',
  USDC: 'usd-coin',
};

/** "BTC", "btc" and "BTC-USD" all map to CoinGecko's "bitcoin"; unknown symbols map to null. */
export function coinGeckoIdForSymbol(symbol: string): string | null {
  const base = symbol.trim().toUpperCase().replace(/-USD$/, '');
  return COINGECKO_IDS[base] ?? null;
}

/** Reads the USD price out of CoinGecko's `simple/price?ids=<id>&vs_currencies=usd` response. */
export function extractCoinGeckoPrice(payload: unknown, id: string): number | null {
  const price = (payload as Record<string, { usd?: unknown } | undefined> | null)?.[id]?.usd;
  return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : null;
}

export interface YahooHistoryPoint {
  /** YYYY-MM-DD, in UTC — trading-day granularity is all this needs, so timezone precision within a day doesn't matter. */
  date: string;
  close: number;
}

/**
 * Extracts a daily closing-price series from Yahoo's chart response for a `range`/`interval`
 * query. Yahoo returns parallel `timestamp` and `indicators.quote[0].close` arrays that can
 * both contain gaps (nulls) for partial trading days — any index missing either value is
 * skipped rather than plotted as a fabricated zero.
 */
export function extractYahooHistory(payload: unknown): YahooHistoryPoint[] {
  const result = (
    payload as {
      chart?: { result?: Array<{ timestamp?: unknown; indicators?: { quote?: Array<{ close?: unknown }> } }> };
    }
  )?.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const closes = result?.indicators?.quote?.[0]?.close;
  if (!Array.isArray(timestamps) || !Array.isArray(closes)) return [];

  const points: YahooHistoryPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const close = closes[i];
    if (typeof ts !== 'number' || typeof close !== 'number' || !Number.isFinite(close)) continue;
    points.push({ date: new Date(ts * 1000).toISOString().slice(0, 10), close });
  }
  return points;
}

export interface BenchmarkSeriesSnapshot {
  snapshot_date: string;
  net_worth: number;
}

export interface BenchmarkPoint {
  date: string;
  netWorth: number;
  benchmark: number;
}

/**
 * Merges net worth snapshots with a benchmark index's daily closes into one date-aligned
 * series for charting. The benchmark is scaled so its value on the first plotted date equals
 * the user's net worth then — otherwise a portfolio in lakhs plotted against a Nifty index
 * value in the thousands would render as two unrelated flat lines on any sane Y axis.
 *
 * Net worth is forward-filled across every benchmark trading day: snapshots are typically
 * one a month (free tier caps them at 2), far sparser than daily index closes, so without
 * forward-filling the net worth line would be almost all gaps. history is filtered to dates
 * on/after the first snapshot — there's nothing meaningful to plot for the user before their
 * first snapshot exists.
 */
export function buildBenchmarkSeries(
  snapshots: BenchmarkSeriesSnapshot[],
  history: YahooHistoryPoint[]
): BenchmarkPoint[] {
  if (snapshots.length === 0 || history.length === 0) return [];

  const sortedSnapshots = [...snapshots].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));

  const firstDate = sortedSnapshots[0]!.snapshot_date;
  const firstNetWorth = sortedSnapshots[0]!.net_worth;
  const relevantHistory = sortedHistory.filter((h) => h.date >= firstDate);
  if (relevantHistory.length === 0) return [];

  const scale = relevantHistory[0]!.close !== 0 ? firstNetWorth / relevantHistory[0]!.close : 0;

  let snapshotIndex = -1;
  let lastNetWorth = firstNetWorth;

  return relevantHistory.map((h) => {
    while (snapshotIndex + 1 < sortedSnapshots.length && sortedSnapshots[snapshotIndex + 1]!.snapshot_date <= h.date) {
      snapshotIndex++;
      lastNetWorth = sortedSnapshots[snapshotIndex]!.net_worth;
    }
    return { date: h.date, netWorth: lastNetWorth, benchmark: h.close * scale };
  });
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
