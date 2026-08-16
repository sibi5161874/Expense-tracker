/**
 * Multi-currency support — pure conversion logic. Network fetching lives in the
 * API route; everything here is deterministic and unit tested, matching the
 * pattern already used for price refresh and statement import.
 *
 * Scope: `accounts.currency` already existed in the schema (default 'INR') but
 * was never used for conversion — every balance was silently treated as INR
 * regardless of what currency was recorded. This makes that field load-bearing:
 * INR is the app's one fixed base/reporting currency (matches your actual home
 * market), and any account in another currency converts to INR wherever it
 * contributes to a total — net worth, dashboard KPIs, reports. The account's
 * own currency is still what's shown on that account's own transactions.
 */

export const BASE_CURRENCY = 'INR';

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AED', label: 'UAE Dirham', symbol: 'AED' },
  { code: 'QAR', label: 'Qatari Riyal', symbol: 'QAR' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code'];

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return SUPPORTED_CURRENCIES.some((c) => c.code === code);
}

export function getCurrencySymbol(code: string): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

/** `rates` is base-INR: rates[X] = how many units of X one INR buys (matches open.er-api.com's shape). */
export type FxRates = Record<string, number>;

/**
 * Converts an amount from `fromCurrency` into INR.
 *
 * INR-denominated amounts pass through unchanged even when `rates` is empty or
 * still loading — the overwhelming majority of accounts are INR, and they must
 * never be blocked on a network call that has nothing to do with them.
 *
 * A foreign amount with no matching rate returns null rather than 0: silently
 * treating a missing rate as "worth nothing" would understate a real balance
 * and could make an account look emptied out that isn't. The caller decides
 * how to surface that (exclude from the total, show a warning) — this function
 * never guesses.
 */
export function convertToBaseCurrency(amount: number, fromCurrency: string, rates: FxRates): number | null {
  if (fromCurrency === BASE_CURRENCY) return amount;

  const rate = rates[fromCurrency];
  if (!rate || rate <= 0) return null;

  // rates[X] = units of X per 1 INR, so INR = amount / rate.
  return amount / rate;
}

export interface CurrencyConversionSummary {
  /** Total successfully converted to INR. */
  totalInBase: number;
  /** Currency codes that had an amount but no usable rate — excluded from totalInBase. */
  unconvertedCurrencies: string[];
}

/**
 * Sums a list of (amount, currency) pairs into one INR total, tracking which
 * currencies couldn't be converted so the caller can warn rather than silently
 * under-report net worth.
 */
export function sumInBaseCurrency(
  entries: Array<{ amount: number; currency: string }>,
  rates: FxRates
): CurrencyConversionSummary {
  let totalInBase = 0;
  const unconverted = new Set<string>();

  for (const entry of entries) {
    const converted = convertToBaseCurrency(entry.amount, entry.currency, rates);
    if (converted === null) {
      unconverted.add(entry.currency);
      continue;
    }
    totalInBase += converted;
  }

  return { totalInBase, unconvertedCurrencies: [...unconverted] };
}
