import { describe, expect, it } from 'vitest';
import { segmentHoldingsByAssetClass } from './portfolioSegmentation';
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

describe('portfolioSegmentation', () => {
  it('segmentHoldingsByAssetClass returns empty array for empty input', () => {
    expect(segmentHoldingsByAssetClass([])).toEqual([]);
    // @ts-expect-error defensive test with undefined
    expect(segmentHoldingsByAssetClass(undefined)).toEqual([]);
  });

  it('segmentHoldingsByAssetClass groups 3 Stocks + 2 MFs correctly', () => {
    const holdings: SymbolHolding[] = [
      makeHolding({ symbol: 'INFY', assetType: 'Stock', invested: 1000, currentValue: 1200, unrealisedPnl: 200, returnPct: 0.2 }),
      makeHolding({ symbol: 'TCS', assetType: 'Stock', invested: 2000, currentValue: 2200, unrealisedPnl: 200, returnPct: 0.1 }),
      makeHolding({ symbol: 'RELIANCE', assetType: 'Stock', invested: 3000, currentValue: 2700, unrealisedPnl: -300, returnPct: -0.1 }),
      makeHolding({ symbol: 'HDFC_NIFTY50', assetType: 'Mutual Fund', invested: 5000, currentValue: 6000, unrealisedPnl: 1000, returnPct: 0.2 }),
      makeHolding({ symbol: 'PARAG_PARIKH', assetType: 'Mutual Fund', invested: 4000, currentValue: 4400, unrealisedPnl: 400, returnPct: 0.1 }),
    ];

    const segments = segmentHoldingsByAssetClass(holdings);
    expect(segments).toHaveLength(2);

    const stockSegment = segments.find((s) => s.assetType === 'Stock');
    expect(stockSegment).toBeDefined();
    expect(stockSegment!.holdings).toHaveLength(3);
    expect(stockSegment!.totalInvested).toBe(6000);
    expect(stockSegment!.totalCurrent).toBe(6100);
    expect(stockSegment!.totalPnl).toBe(100);

    const mfSegment = segments.find((s) => s.assetType === 'Mutual Fund');
    expect(mfSegment).toBeDefined();
    expect(mfSegment!.holdings).toHaveLength(2);
    expect(mfSegment!.totalInvested).toBe(9000);
    expect(mfSegment!.totalCurrent).toBe(10400);
    expect(mfSegment!.totalPnl).toBe(1400);
  });

  it('avgReturnPct is weighted by currentValue, not simple average', () => {
    // Holding 1: returnPct = 0.10 (10%), currentValue = 1000
    // Holding 2: returnPct = 0.50 (50%), currentValue = 3000
    // Simple average = (0.10 + 0.50) / 2 = 0.30 (30%)
    // Weighted average by currentValue = (0.10 * 1000 + 0.50 * 3000) / 4000 = (100 + 1500) / 4000 = 1600 / 4000 = 0.40 (40%)
    const holdings: SymbolHolding[] = [
      makeHolding({ symbol: 'H1', assetType: 'Stock', invested: 909.09, currentValue: 1000, returnPct: 0.10, unrealisedPnl: 90.91 }),
      makeHolding({ symbol: 'H2', assetType: 'Stock', invested: 2000, currentValue: 3000, returnPct: 0.50, unrealisedPnl: 1000 }),
    ];

    const segments = segmentHoldingsByAssetClass(holdings);
    expect(segments).toHaveLength(1);
    expect(segments[0]!.avgReturnPct).toBeCloseTo(0.40, 5);
  });

  it('Handles holdings with assetType "Stock" and "Stock " (trailing space) as same group', () => {
    const holdings: SymbolHolding[] = [
      makeHolding({ symbol: 'INFY', assetType: 'Stock', invested: 1000, currentValue: 1100 }),
      makeHolding({ symbol: 'TCS', assetType: 'Stock ', invested: 2000, currentValue: 2200 }),
      makeHolding({ symbol: 'WIPRO', assetType: ' Stock', invested: 500, currentValue: 550 }),
    ];

    const segments = segmentHoldingsByAssetClass(holdings);
    expect(segments).toHaveLength(1);
    expect(segments[0]!.assetType).toBe('Stock');
    expect(segments[0]!.holdings).toHaveLength(3);
    expect(segments[0]!.totalInvested).toBe(3500);
  });

  it('totalPnl correctly sums unrealisedPnl across all holdings in a segment', () => {
    const holdings: SymbolHolding[] = [
      makeHolding({ symbol: 'S1', assetType: 'Stock', unrealisedPnl: -500 }),
      makeHolding({ symbol: 'S2', assetType: 'Stock', unrealisedPnl: -200 }),
      makeHolding({ symbol: 'S3', assetType: 'Stock', unrealisedPnl: 1000 }),
    ];

    const segments = segmentHoldingsByAssetClass(holdings);
    expect(segments[0]!.totalPnl).toBe(300);
  });

  it('handles all-loss portfolio segment gracefully', () => {
    const holdings: SymbolHolding[] = [
      makeHolding({ symbol: 'L1', assetType: 'Crypto', invested: 1000, currentValue: 500, unrealisedPnl: -500, returnPct: -0.5 }),
      makeHolding({ symbol: 'L2', assetType: 'Crypto', invested: 2000, currentValue: 1000, unrealisedPnl: -1000, returnPct: -0.5 }),
    ];

    const segments = segmentHoldingsByAssetClass(holdings);
    expect(segments).toHaveLength(1);
    expect(segments[0]!.totalPnl).toBe(-1500);
    expect(segments[0]!.avgReturnPct).toBeCloseTo(-0.5, 5);
  });

  it('handles single holding segment', () => {
    const holdings: SymbolHolding[] = [
      makeHolding({ symbol: 'GOLD_ETF', assetType: 'Gold', invested: 5000, currentValue: 5500, unrealisedPnl: 500, returnPct: 0.1 }),
    ];

    const segments = segmentHoldingsByAssetClass(holdings);
    expect(segments).toHaveLength(1);
    expect(segments[0]!.assetType).toBe('Gold');
    expect(segments[0]!.totalInvested).toBe(5000);
    expect(segments[0]!.totalCurrent).toBe(5500);
    expect(segments[0]!.totalPnl).toBe(500);
    expect(segments[0]!.avgReturnPct).toBe(0.1);
  });
});
