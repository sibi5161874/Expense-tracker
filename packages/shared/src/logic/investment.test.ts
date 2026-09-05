import { describe, expect, it } from 'vitest';
import {
  calculateTotalCashflow,
  calculateUnitsHeld,
  calculateAvgBuyPrice,
  calculatePortfolioHolding,
  groupInvestmentsBySymbol,
  calculatePortfolioSummary,
  summarizeHoldings,
} from './investment';

type Action = 'BUY' | 'SELL' | 'SIP' | 'DIVIDEND' | 'BONUS' | 'SPLIT';

function entry(action: Action, quantity: number, price: number, date = '2026-01-01', symbol = 'RELIANCE') {
  return { symbol, exchange: 'NSE', asset_type: 'Stock', date, action, quantity, price };
}

describe('calculateTotalCashflow', () => {
  it('is negative for BUY — money leaves the account, fees included', () => {
    expect(calculateTotalCashflow('BUY', 10, 100, 20)).toBe(-1020);
  });

  it('treats SIP the same as BUY', () => {
    expect(calculateTotalCashflow('SIP', 10, 100, 20)).toBe(-1020);
  });

  it('is positive for SELL — proceeds net of fees', () => {
    expect(calculateTotalCashflow('SELL', 10, 100, 20)).toBe(980);
  });

  it('returns the price field for DIVIDEND (which holds the amount received, not a unit price)', () => {
    expect(calculateTotalCashflow('DIVIDEND', 0, 500, 0)).toBe(500);
  });

  it.each(['BONUS', 'SPLIT'] as const)('is exactly 0 for %s — free units, no cash moves', (action) => {
    expect(calculateTotalCashflow(action, 10, 100, 20)).toBe(0);
  });

  it('handles zero fees', () => {
    expect(calculateTotalCashflow('BUY', 10, 100, 0)).toBe(-1000);
  });
});

describe('calculateUnitsHeld', () => {
  it('adds BUY and SIP units', () => {
    expect(calculateUnitsHeld([entry('BUY', 10, 100), entry('SIP', 5, 110)])).toBe(15);
  });

  it('subtracts SELL units', () => {
    expect(calculateUnitsHeld([entry('BUY', 10, 100), entry('SELL', 4, 120)])).toBe(6);
  });

  it('adds BONUS and SPLIT units (free units still increase the position)', () => {
    expect(calculateUnitsHeld([entry('BUY', 10, 100), entry('BONUS', 10, 0), entry('SPLIT', 20, 0)])).toBe(40);
  });

  it('ignores DIVIDEND entirely — it pays cash, not units', () => {
    expect(calculateUnitsHeld([entry('BUY', 10, 100), entry('DIVIDEND', 0, 500)])).toBe(10);
  });

  it('is 0 for a fully exited position', () => {
    expect(calculateUnitsHeld([entry('BUY', 10, 100), entry('SELL', 10, 120)])).toBe(0);
  });

  it('is 0 for no entries', () => {
    expect(calculateUnitsHeld([])).toBe(0);
  });

  it('can go negative if more is sold than bought (data-entry error surfaces rather than silently clamping)', () => {
    expect(calculateUnitsHeld([entry('BUY', 5, 100), entry('SELL', 8, 120)])).toBe(-3);
  });
});

describe('calculateAvgBuyPrice', () => {
  it('weights by quantity, not a simple mean of prices', () => {
    // 10@100 + 90@200 => 19000/100 = 190, NOT (100+200)/2 = 150
    expect(calculateAvgBuyPrice([entry('BUY', 10, 100), entry('BUY', 90, 200)])).toBe(190);
  });

  it('includes SIP entries in the weighted average', () => {
    expect(calculateAvgBuyPrice([entry('BUY', 10, 100), entry('SIP', 10, 200)])).toBe(150);
  });

  it('excludes BONUS/SPLIT so free units do not drag the average toward zero', () => {
    const withFreeUnits = calculateAvgBuyPrice([entry('BUY', 10, 100), entry('BONUS', 10, 0)]);
    expect(withFreeUnits).toBe(100);
  });

  it('ignores SELL — average BUY price is a cost measure, unaffected by exits', () => {
    expect(calculateAvgBuyPrice([entry('BUY', 10, 100), entry('SELL', 5, 500)])).toBe(100);
  });

  it('returns 0 rather than dividing by zero when there are no buys', () => {
    expect(calculateAvgBuyPrice([entry('DIVIDEND', 0, 500)])).toBe(0);
    expect(calculateAvgBuyPrice([])).toBe(0);
  });
});

describe('calculatePortfolioHolding', () => {
  it('computes value, P&L, return % and allocation % together', () => {
    const result = calculatePortfolioHolding([entry('BUY', 10, 100)], 150, 3000);
    expect(result).toMatchObject({
      unitsHeld: 10,
      avgBuyPrice: 100,
      livePrice: 150,
      currentValue: 1500,
      unrealisedPnl: 500,
    });
    expect(result.returnPct).toBeCloseTo(0.5);
    expect(result.allocationPct).toBeCloseTo(0.5);
  });

  it('reports a loss when the live price is below the average buy price', () => {
    const result = calculatePortfolioHolding([entry('BUY', 10, 100)], 80, 800);
    expect(result.unrealisedPnl).toBe(-200);
    expect(result.returnPct).toBeCloseTo(-0.2);
  });

  it('returns 0 for returnPct instead of dividing by a zero cost basis', () => {
    // BONUS-only position: units held, but nothing was paid for them.
    const result = calculatePortfolioHolding([entry('BONUS', 10, 0)], 150, 1500);
    expect(result.avgBuyPrice).toBe(0);
    expect(result.returnPct).toBe(0);
  });

  it('returns 0 for allocationPct when the portfolio total is 0', () => {
    expect(calculatePortfolioHolding([entry('BUY', 10, 100)], 150, 0).allocationPct).toBe(0);
  });
});

describe('groupInvestmentsBySymbol', () => {
  const multi = [
    entry('BUY', 10, 100, '2026-01-01', 'RELIANCE'),
    entry('BUY', 5, 200, '2026-02-01', 'RELIANCE'),
    entry('BUY', 20, 50, '2026-01-15', 'TCS'),
  ];

  it('groups entries per symbol', () => {
    const holdings = groupInvestmentsBySymbol(multi);
    expect(holdings.map((h) => h.symbol).sort()).toEqual(['RELIANCE', 'TCS']);
  });

  it('excludes fully exited positions (units <= 0) from the portfolio', () => {
    const holdings = groupInvestmentsBySymbol([
      entry('BUY', 10, 100, '2026-01-01', 'RELIANCE'),
      entry('SELL', 10, 120, '2026-02-01', 'RELIANCE'),
    ]);
    expect(holdings).toEqual([]);
  });

  it('prefers a live price override over the most recent trade price', () => {
    const holdings = groupInvestmentsBySymbol(multi, { RELIANCE: 999 });
    const reliance = holdings.find((h) => h.symbol === 'RELIANCE')!;
    expect(reliance.currentPrice).toBe(999);
    expect(reliance.currentValue).toBe(15 * 999);
  });

  it('falls back to the most recent trade price when no override exists', () => {
    const reliance = groupInvestmentsBySymbol(multi).find((h) => h.symbol === 'RELIANCE')!;
    // Most recent by date is 2026-02-01 @ 200, not the first or largest entry.
    expect(reliance.currentPrice).toBe(200);
  });

  it('picks the most recent price by date, not by array order', () => {
    const outOfOrder = [
      entry('BUY', 10, 100, '2026-02-01', 'INFY'),
      entry('BUY', 10, 300, '2026-01-01', 'INFY'), // older, listed later
    ];
    expect(groupInvestmentsBySymbol(outOfOrder)[0]!.currentPrice).toBe(100);
  });

  it('computes invested from units held x avg buy price', () => {
    const reliance = groupInvestmentsBySymbol(multi, { RELIANCE: 200 }).find((h) => h.symbol === 'RELIANCE')!;
    // avg = (10*100 + 5*200)/15 = 2000/15 = 133.33
    expect(reliance.avgBuyPrice).toBeCloseTo(133.3333, 3);
    expect(reliance.invested).toBeCloseTo(2000, 6);
    expect(reliance.unrealisedPnl).toBeCloseTo(15 * 200 - 2000, 6);
  });

  it('returns an empty array for no investments', () => {
    expect(groupInvestmentsBySymbol([])).toEqual([]);
  });

  it('marks hasLivePrice true only when an override actually exists for that symbol', () => {
    const holdings = groupInvestmentsBySymbol(multi, { RELIANCE: 999 });
    expect(holdings.find((h) => h.symbol === 'RELIANCE')!.hasLivePrice).toBe(true);
    expect(holdings.find((h) => h.symbol === 'TCS')!.hasLivePrice).toBe(false);
  });

  it('marks hasLivePrice false for every symbol when no overrides are passed at all', () => {
    const holdings = groupInvestmentsBySymbol(multi);
    expect(holdings.every((h) => h.hasLivePrice === false)).toBe(true);
  });
});

describe('summarizeHoldings / calculatePortfolioSummary', () => {
  it('sums invested and current value across symbols', () => {
    const summary = calculatePortfolioSummary([
      entry('BUY', 10, 100, '2026-01-01', 'RELIANCE'),
      entry('BUY', 20, 50, '2026-01-15', 'TCS'),
    ]);
    // No overrides, so current price == most recent trade price == buy price:
    // P&L is exactly 0 rather than a spurious gain.
    expect(summary.totalInvested).toBe(2000);
    expect(summary.currentValue).toBe(2000);
    expect(summary.totalPnl).toBe(0);
    expect(summary.pnlPercentage).toBe(0);
  });

  it('reports pnlPercentage as a percentage, not a fraction', () => {
    const summary = summarizeHoldings([
      {
        symbol: 'X',
        exchange: 'NSE',
        assetType: 'Stock',
        unitsHeld: 10,
        avgBuyPrice: 100,
        currentPrice: 150,
        currentValue: 1500,
        invested: 1000,
        unrealisedPnl: 500,
        returnPct: 0.5,
        lotCount: 1,
        hasLivePrice: true,
      },
    ]);
    expect(summary.pnlPercentage).toBe(50);
  });

  it('returns 0 for pnlPercentage instead of dividing by zero when nothing is invested', () => {
    expect(summarizeHoldings([]).pnlPercentage).toBe(0);
    expect(summarizeHoldings([]).totalInvested).toBe(0);
  });
});
