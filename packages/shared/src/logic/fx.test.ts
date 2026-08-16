import { describe, expect, it } from 'vitest';
import {
  convertToBaseCurrency,
  sumInBaseCurrency,
  isSupportedCurrency,
  getCurrencySymbol,
  BASE_CURRENCY,
} from './fx';

// rates[X] = units of X per 1 INR (matches open.er-api.com's base=INR shape).
const RATES = { USD: 0.012, EUR: 0.011, SGD: 0.0155 };

describe('convertToBaseCurrency', () => {
  it('passes an INR amount through unchanged, even with no rates available', () => {
    expect(convertToBaseCurrency(1000, 'INR', {})).toBe(1000);
  });

  it('converts a foreign amount to INR using the base-INR rate', () => {
    // 100 USD / 0.012 (USD per INR) = 8333.33 INR
    expect(convertToBaseCurrency(100, 'USD', RATES)).toBeCloseTo(8333.33, 1);
  });

  it('returns null (not 0) when no rate exists for the currency', () => {
    expect(convertToBaseCurrency(100, 'AED', RATES)).toBeNull();
  });

  it('returns null for a zero or negative rate rather than dividing into a nonsense value', () => {
    expect(convertToBaseCurrency(100, 'USD', { USD: 0 })).toBeNull();
    expect(convertToBaseCurrency(100, 'USD', { USD: -1 })).toBeNull();
  });

  it('never blocks INR on rates being empty/unloaded — the common case must not depend on the network', () => {
    expect(convertToBaseCurrency(500, BASE_CURRENCY, {})).toBe(500);
  });
});

describe('sumInBaseCurrency', () => {
  it('sums INR and convertible foreign amounts into one total', () => {
    const { totalInBase, unconvertedCurrencies } = sumInBaseCurrency(
      [
        { amount: 1000, currency: 'INR' },
        { amount: 100, currency: 'USD' },
      ],
      RATES
    );
    expect(totalInBase).toBeCloseTo(1000 + 8333.33, 1);
    expect(unconvertedCurrencies).toEqual([]);
  });

  it('excludes an unconvertible currency from the total rather than treating it as 0', () => {
    const { totalInBase, unconvertedCurrencies } = sumInBaseCurrency(
      [
        { amount: 1000, currency: 'INR' },
        { amount: 500, currency: 'AED' }, // no rate in RATES
      ],
      RATES
    );
    expect(totalInBase).toBe(1000);
    expect(unconvertedCurrencies).toEqual(['AED']);
  });

  it('deduplicates repeated unconvertible currencies', () => {
    const { unconvertedCurrencies } = sumInBaseCurrency(
      [
        { amount: 100, currency: 'AED' },
        { amount: 200, currency: 'AED' },
      ],
      RATES
    );
    expect(unconvertedCurrencies).toEqual(['AED']);
  });

  it('returns a zero total for an empty list, not NaN or an error', () => {
    expect(sumInBaseCurrency([], RATES)).toEqual({ totalInBase: 0, unconvertedCurrencies: [] });
  });
});

describe('isSupportedCurrency / getCurrencySymbol', () => {
  it('recognizes a supported currency', () => {
    expect(isSupportedCurrency('USD')).toBe(true);
    expect(isSupportedCurrency('XYZ')).toBe(false);
  });

  it('returns the right symbol for a known currency', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('INR')).toBe('₹');
  });

  it('falls back to the raw code for an unknown currency rather than throwing', () => {
    expect(getCurrencySymbol('XYZ')).toBe('XYZ');
  });
});
