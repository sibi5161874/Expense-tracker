import { describe, expect, it } from 'vitest';
import { extractStockFundamentals, calculatePassiveIncome } from './stockFundamentals';

function payloadWithSummary(summaryDetail: Record<string, unknown>) {
  return { quoteSummary: { result: [{ summaryDetail }] } };
}

describe('extractStockFundamentals', () => {
  it('unwraps Yahoo\'s { raw, fmt } shape for every field', () => {
    const fundamentals = extractStockFundamentals(
      payloadWithSummary({
        trailingPE: { raw: 23.5, fmt: '23.50' },
        forwardPE: { raw: 20.1, fmt: '20.10' },
        fiftyTwoWeekHigh: { raw: 3000, fmt: '3,000.00' },
        fiftyTwoWeekLow: { raw: 2100, fmt: '2,100.00' },
        profitMargins: { raw: 0.18, fmt: '18.00%' },
        marketCap: { raw: 19_500_000_000_000, fmt: '19.5T' },
        beta: { raw: 0.85, fmt: '0.85' },
        trailingAnnualDividendYield: { raw: 0.012, fmt: '1.20%' },
      })
    );
    expect(fundamentals).toEqual({
      trailingPE: 23.5,
      forwardPE: 20.1,
      fiftyTwoWeekHigh: 3000,
      fiftyTwoWeekLow: 2100,
      profitMargins: 0.18,
      marketCap: 19_500_000_000_000,
      beta: 0.85,
      trailingAnnualDividendYield: 0.012,
    });
  });

  it('also accepts a bare number, not just the wrapped shape', () => {
    const fundamentals = extractStockFundamentals(payloadWithSummary({ trailingPE: 23.5 }));
    expect(fundamentals?.trailingPE).toBe(23.5);
  });

  it('is null per-field when a stat is missing — an index fund with no P/E, say — not a total failure', () => {
    const fundamentals = extractStockFundamentals(payloadWithSummary({ marketCap: { raw: 1000 } }));
    expect(fundamentals).toMatchObject({ trailingPE: null, forwardPE: null, marketCap: 1000 });
  });

  it('is null for a malformed payload rather than throwing', () => {
    expect(extractStockFundamentals({})).toBeNull();
    expect(extractStockFundamentals(null)).toBeNull();
    expect(extractStockFundamentals({ quoteSummary: { result: [] } })).toBeNull();
  });
});

describe('calculatePassiveIncome', () => {
  it('sums units × price × yield across holdings', () => {
    const result = calculatePassiveIncome([
      { unitsHeld: 100, currentPrice: 500, dividendYield: 0.02 }, // 1000
      { unitsHeld: 50, currentPrice: 1000, dividendYield: 0.01 }, // 500
    ]);
    expect(result.annualIncome).toBe(1500);
  });

  it('monthly is exactly annual / 12, never computed from a separate source', () => {
    const result = calculatePassiveIncome([{ unitsHeld: 10, currentPrice: 100, dividendYield: 0.12 }]);
    expect(result.annualIncome).toBe(120);
    expect(result.monthlyIncome).toBeCloseTo(10, 10);
  });

  it('treats a null yield as zero income for that holding, not an exclusion', () => {
    const result = calculatePassiveIncome([
      { unitsHeld: 100, currentPrice: 500, dividendYield: null },
      { unitsHeld: 10, currentPrice: 100, dividendYield: 0.05 },
    ]);
    expect(result.annualIncome).toBe(50);
  });

  it('is zero for no holdings', () => {
    expect(calculatePassiveIncome([])).toEqual({ annualIncome: 0, monthlyIncome: 0 });
  });
});
