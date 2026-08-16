const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** The app's one fixed reporting/base currency — every aggregate total (net worth, dashboard, reports) is INR. */
export function formatINR(amount: number): string {
  return INR_FORMATTER.format(amount);
}

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

/**
 * Formats an amount in its OWN currency — for displaying a foreign-currency
 * account's balance as-recorded, never for aggregate totals (those are always
 * INR via formatINR). Falls back to INR formatting for an unrecognized code
 * rather than throwing, since Intl.NumberFormat rejects invalid currency codes.
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const code = currencyCode.trim().toUpperCase() || "INR";
  let formatter = currencyFormatterCache.get(code);

  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      formatter = INR_FORMATTER;
    }
    currencyFormatterCache.set(code, formatter);
  }

  return formatter.format(amount);
}
