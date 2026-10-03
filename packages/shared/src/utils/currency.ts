export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const POPULAR_CURRENCIES: readonly CurrencyOption[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', locale: 'en-GB' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)', locale: 'en-AE' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal (SAR)', locale: 'en-SA' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD)', locale: 'en-SG' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD)', locale: 'en-AU' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)', locale: 'ja-JP' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal (QAR)', locale: 'en-QA' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc (CHF)', locale: 'de-CH' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan (CNY)', locale: 'zh-CN' },
] as const;

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** The app's default reporting/base currency formatting. */
export function formatINR(amount: number): string {
  return INR_FORMATTER.format(amount);
}

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

/**
 * Formats an amount in its designated currency.
 */
export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
  const code = currencyCode.trim().toUpperCase() || "INR";
  let formatter = currencyFormatterCache.get(code);

  if (!formatter) {
    const currencyInfo = POPULAR_CURRENCIES.find((c) => c.code === code);
    const locale = currencyInfo?.locale ?? "en-IN";
    try {
      formatter = new Intl.NumberFormat(locale, {
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
