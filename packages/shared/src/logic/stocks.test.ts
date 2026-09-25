import { describe, expect, it } from 'vitest';
import { calculateWAC, filterAndSortHoldings } from './stocks';
import type { SymbolHolding } from './investment';

function makeHolding(overrides: Partial<SymbolHolding>): SymbolHolding {
  const invested = overrides.invested ?? 1000;
  const currentValue = overrides.currentValue ?? 1200;
  const unrealisedPnl = overrides.unrealisedPnl ?? (currentValue - invested);
  const returnPct = overrides.returnPct ?? (invested > 0 ? unrealisedPnl / invested : 0);

  return {
    symbol: 'TEST',
    exchange: 'NSE',
    assetType: 'Stock',
    unitsHeld: 10,
    avgBuyPrice: 100,
    currentPrice: 120,
    currentValue,
    invested,
    unrealisedPnl,
    returnPct,
    lotCount: 1,
    hasLivePrice: true,
    ...overrides,
  };
}

describe('calculateWAC', () => {
  it('averages two lots weighted by quantity', () => {
    // (10*100 + 10*200) / 20 = 150
    expect(calculateWAC([{ qty: 10, price: 100 }, { qty: 10, price: 200 }])).toBe(150);
  });

  it('weights toward the larger lot', () => {
    // (90*100 + 10*200) / 100 = 110
    expect(calculateWAC([{ qty: 90, price: 100 }, { qty: 10, price: 200 }])).toBe(110);
  });

  it('is 0 for no lots or zero total quantity', () => {
    expect(calculateWAC([])).toBe(0);
    expect(calculateWAC([{ qty: 0, price: 100 }])).toBe(0);
  });
});

describe('filterAndSortHoldings', () => {
  const mockHoldings: SymbolHolding[] = [
    makeHolding({ symbol: 'TCS.NS', exchange: 'NSE', assetType: 'Stock', invested: 3000, currentValue: 3600, returnPct: 0.20, unrealisedPnl: 600 }),
    makeHolding({ symbol: 'INFY', exchange: 'NSE', assetType: 'Stock', invested: 2000, currentValue: 1600, returnPct: -0.20, unrealisedPnl: -400 }),
    makeHolding({ symbol: 'HDFCBANK', exchange: 'NSE', assetType: 'Stock', invested: 4000, currentValue: 4600, returnPct: 0.15, unrealisedPnl: 600 }),
    makeHolding({ symbol: 'HDFC_NIFTY50', exchange: 'NSE', assetType: 'Mutual Fund', invested: 5000, currentValue: 6000, returnPct: 0.20, unrealisedPnl: 1000 }),
    makeHolding({ symbol: 'HDFC_BALANCED', exchange: 'NSE', assetType: 'Mutual Fund', invested: 3000, currentValue: 2700, returnPct: -0.10, unrealisedPnl: -300 }),
    makeHolding({ symbol: 'GOLDBEES', exchange: 'NSE', assetType: 'ETF', invested: 1000, currentValue: 1100, returnPct: 0.10, unrealisedPnl: 100 }),
  ];

  it('returns empty array for empty input', () => {
    expect(filterAndSortHoldings([])).toEqual([]);
    // @ts-expect-error defensive test with undefined
    expect(filterAndSortHoldings(undefined)).toEqual([]);
  });

  it("filterAndSortHoldings with filter='loss' returns only negative-return holdings", () => {
    const result = filterAndSortHoldings(mockHoldings, { filter: 'loss' });
    expect(result.length).toBe(2);
    expect(result.map((h) => h.symbol)).toContain('INFY');
    expect(result.map((h) => h.symbol)).toContain('HDFC_BALANCED');
    expect(result.every((h) => h.returnPct < 0 || h.unrealisedPnl < 0)).toBe(true);
  });

  it("filterAndSortHoldings with sortBy='returnPct_asc' sorts worst first", () => {
    const result = filterAndSortHoldings(mockHoldings, { sortBy: 'returnPct_asc' });
    expect(result[0]!.symbol).toBe('INFY'); // -20%
    expect(result[1]!.symbol).toBe('HDFC_BALANCED'); // -10%
    expect(result[result.length - 1]!.returnPct).toBe(0.20);
  });

  it("filterAndSortHoldings with sortBy='returnPct_desc' sorts highest return first", () => {
    const result = filterAndSortHoldings(mockHoldings, { sortBy: 'returnPct_desc' });
    expect(result[0]!.returnPct).toBe(0.20);
    expect(result[result.length - 1]!.symbol).toBe('INFY');
  });

  it("filterAndSortHoldings with sortBy='invested_desc' sorts highest invested first", () => {
    const result = filterAndSortHoldings(mockHoldings, { sortBy: 'invested_desc' });
    expect(result[0]!.symbol).toBe('HDFC_NIFTY50'); // 5000
    expect(result[1]!.symbol).toBe('HDFCBANK'); // 4000
  });

  it("filterAndSortHoldings with searchQuery='tcs' matches 'TCS.NS' case-insensitively", () => {
    const result = filterAndSortHoldings(mockHoldings, { searchQuery: 'tcs' });
    expect(result.length).toBe(1);
    expect(result[0]!.symbol).toBe('TCS.NS');
  });

  it("filterAndSortHoldings with assetType='Stock' excludes Mutual Funds", () => {
    const result = filterAndSortHoldings(mockHoldings, { assetType: 'Stock' });
    expect(result.length).toBe(3);
    expect(result.every((h) => h.assetType === 'Stock')).toBe(true);
  });

  it("filterAndSortHoldings with assetType='All' returns all asset types", () => {
    const result = filterAndSortHoldings(mockHoldings, { assetType: 'All' });
    expect(result.length).toBe(mockHoldings.length);
  });

  it("Combining filter='profit' + sortBy='returnPct_desc' + search 'HDFC' returns correct subset", () => {
    const result = filterAndSortHoldings(mockHoldings, {
      filter: 'profit',
      sortBy: 'returnPct_desc',
      searchQuery: 'HDFC',
    });

    expect(result.length).toBe(2);
    // HDFC_NIFTY50 has return 0.20, HDFCBANK has return 0.15
    expect(result[0]!.symbol).toBe('HDFC_NIFTY50');
    expect(result[1]!.symbol).toBe('HDFCBANK');
  });
});
