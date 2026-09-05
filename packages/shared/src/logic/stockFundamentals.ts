/**
 * Stock fundamentals — pure parsing of Yahoo Finance's quoteSummary endpoint, plus the
 * passive-income projection built on top of it. Kept separate from priceRefresh.ts: that
 * file is about resolving a *price* to keep holdings valued correctly; this is about
 * secondary, non-price stats (P/E, margins, dividend yield) that only ever feed display and
 * a projection, never a stored value.
 */

/** Yahoo wraps most numeric fields as `{ raw, fmt }` rather than a bare number. */
function extractRaw(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value && typeof value === 'object' && 'raw' in value) {
    const raw = (value as { raw?: unknown }).raw;
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
  }
  return null;
}

export interface StockFundamentals {
  trailingPE: number | null;
  forwardPE: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  profitMargins: number | null;
  marketCap: number | null;
  beta: number | null;
  /** A fraction (0.015 = 1.5%), not a percentage — matches Yahoo's own raw value. */
  trailingAnnualDividendYield: number | null;
}

/**
 * Extracts the fields the fundamentals card and passive-income projection need from
 * quoteSummary's `summaryDetail` module. Every field is independently optional — Yahoo
 * omits stats it doesn't have for a given ticker (index funds have no P/E, for instance)
 * rather than erroring, so this never fails the whole extraction over one missing stat.
 */
export function extractStockFundamentals(payload: unknown): StockFundamentals | null {
  const result = (
    payload as { quoteSummary?: { result?: Array<{ summaryDetail?: Record<string, unknown> }> } }
  )?.quoteSummary?.result?.[0];
  if (!result) return null;

  const summary = result.summaryDetail ?? {};
  return {
    trailingPE: extractRaw(summary.trailingPE),
    forwardPE: extractRaw(summary.forwardPE),
    fiftyTwoWeekHigh: extractRaw(summary.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: extractRaw(summary.fiftyTwoWeekLow),
    profitMargins: extractRaw(summary.profitMargins),
    marketCap: extractRaw(summary.marketCap),
    beta: extractRaw(summary.beta),
    trailingAnnualDividendYield: extractRaw(summary.trailingAnnualDividendYield),
  };
}

export interface DividendYieldHolding {
  unitsHeld: number;
  currentPrice: number;
  /** Null when a symbol's yield couldn't be fetched — treated as 0 income, not excluded, so one failed lookup doesn't drop that holding's (zero) contribution silently from the total. */
  dividendYield: number | null;
}

export interface PassiveIncomeSummary {
  annualIncome: number;
  monthlyIncome: number;
}

/** Annual Passive Income = Σ (units × current price × dividend yield), monthly is just that divided by 12 — no separate data source, so it can't drift from the annual figure. */
export function calculatePassiveIncome(holdings: DividendYieldHolding[]): PassiveIncomeSummary {
  const annualIncome = holdings.reduce(
    (sum, h) => sum + h.unitsHeld * h.currentPrice * (h.dividendYield ?? 0),
    0
  );
  return { annualIncome, monthlyIncome: annualIncome / 12 };
}
