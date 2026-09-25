import { describe, expect, it } from 'vitest';
import { calculateUnrealizedLosses, estimateTaxSavings } from './taxLossHarvesting';
import type { SymbolHolding } from './investment';

function holding(overrides: Partial<SymbolHolding>): SymbolHolding {
  return {
    symbol: 'TEST',
    exchange: 'NSE',
    assetType: 'Stock',
    unitsHeld: 10,
    avgBuyPrice: 100,
    currentPrice: 100,
    currentValue: 1000,
    invested: 1000,
    unrealisedPnl: 0,
    returnPct: 0,
    lotCount: 1,
    hasLivePrice: true,
    ...overrides,
  };
}

describe('calculateUnrealizedLosses', () => {
  it('sums only losing positions, ignoring gains entirely', () => {
    const result = calculateUnrealizedLosses([
      holding({ symbol: 'A', unrealisedPnl: -500 }),
      holding({ symbol: 'B', unrealisedPnl: 300 }),
      holding({ symbol: 'C', unrealisedPnl: -1200 }),
    ]);
    expect(result.totalLoss).toBe(1700);
  });

  it('orders topLosers worst-first', () => {
    const result = calculateUnrealizedLosses([
      holding({ symbol: 'SMALL_LOSS', unrealisedPnl: -100 }),
      holding({ symbol: 'BIG_LOSS', unrealisedPnl: -5000 }),
    ]);
    expect(result.topLosers.map((h) => h.symbol)).toEqual(['BIG_LOSS', 'SMALL_LOSS']);
  });

  it('respects the limit', () => {
    const holdings = Array.from({ length: 10 }, (_, i) => holding({ symbol: `S${i}`, unrealisedPnl: -100 - i }));
    expect(calculateUnrealizedLosses(holdings, 3).topLosers).toHaveLength(3);
  });

  it('is zero/empty when nothing is at a loss', () => {
    const result = calculateUnrealizedLosses([holding({ unrealisedPnl: 500 })]);
    expect(result).toEqual({ totalLoss: 0, topLosers: [] });
  });
});

describe('estimateTaxSavings', () => {
  it('estimateTaxSavings(10000) returns 1500', () => {
    expect(estimateTaxSavings(10000)).toBe(1500);
  });

  it('estimateTaxSavings(0) returns 0', () => {
    expect(estimateTaxSavings(0)).toBe(0);
  });

  it('estimateTaxSavings with negative input returns 0 (defensive)', () => {
    expect(estimateTaxSavings(-5000)).toBe(0);
  });

  it('estimateTaxSavings rounds to 2 decimals', () => {
    // 123.45 * 0.15 = 18.5175 -> rounds to 18.52
    expect(estimateTaxSavings(123.45)).toBe(18.52);
    // 100.33 * 0.15 = 15.0495 -> rounds to 15.05
    expect(estimateTaxSavings(100.33)).toBe(15.05);
  });
});
