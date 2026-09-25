import { describe, expect, it } from 'vitest';
import {
  calculateXirr,
  buildHoldingCashFlows,
  computePortfolioXirr,
} from './xirr';

describe('calculateXirr', () => {
  it('calculates accurate annual return for a 1-year 10% gain', () => {
    // Invest 100,000 on 2024-01-01, receive 110,000 on 2025-01-01 -> ~10% XIRR
    const flows = [
      { date: '2024-01-01', amount: -100000 },
      { date: '2025-01-01', amount: 110000 },
    ];
    const xirr = calculateXirr(flows);
    expect(xirr).not.toBeNull();
    expect(Math.abs((xirr ?? 0) - 10)).toBeLessThan(0.1);
  });

  it('calculates accurate return for monthly SIP over 1 year', () => {
    const flows = [
      { date: '2024-01-01', amount: -10000 },
      { date: '2024-02-01', amount: -10000 },
      { date: '2024-03-01', amount: -10000 },
      { date: '2024-04-01', amount: -10000 },
      { date: '2024-05-01', amount: -10000 },
      { date: '2024-06-01', amount: -10000 },
      { date: '2024-07-01', amount: -10000 },
      { date: '2024-08-01', amount: -10000 },
      { date: '2024-09-01', amount: -10000 },
      { date: '2024-10-01', amount: -10000 },
      { date: '2024-11-01', amount: -10000 },
      { date: '2024-12-01', amount: -10000 },
      { date: '2025-01-01', amount: 135000 }, // Total invested 120k -> 135k
    ];
    const xirr = calculateXirr(flows);
    expect(xirr).not.toBeNull();
    // SIP annual return should be around ~22-25%
    expect(xirr).toBeGreaterThan(20);
    expect(xirr).toBeLessThan(30);
  });

  it('handles negative returns properly', () => {
    const flows = [
      { date: '2024-01-01', amount: -100000 },
      { date: '2025-01-01', amount: 80000 },
    ];
    const xirr = calculateXirr(flows);
    expect(xirr).not.toBeNull();
    expect(Math.abs((xirr ?? 0) - -20)).toBeLessThan(0.2);
  });

  it('returns null when flows lack positive or negative side', () => {
    expect(calculateXirr([{ date: '2024-01-01', amount: -100 }])).toBeNull();
    expect(
      calculateXirr([
        { date: '2024-01-01', amount: -100 },
        { date: '2024-02-01', amount: -200 },
      ])
    ).toBeNull();
  });
});

describe('buildHoldingCashFlows', () => {
  it('combines buys, sells, dividends, and current holding value', () => {
    const logs = [
      { date: '2024-01-01', action: 'BUY', quantity: 10, price: 100, fees: 5 },
      { date: '2024-06-01', action: 'DIVIDEND', quantity: 0, price: 50, fees: 0 },
      { date: '2024-08-01', action: 'SELL', quantity: 2, price: 120, fees: 2 },
    ];
    const flows = buildHoldingCashFlows(logs, 1000, '2025-01-01');

    expect(flows).toHaveLength(4);
    expect(flows[0]).toEqual({ date: '2024-01-01', amount: -1005 });
    expect(flows[1]).toEqual({ date: '2024-06-01', amount: 50 });
    expect(flows[2]).toEqual({ date: '2024-08-01', amount: 238 });
    expect(flows[3]).toEqual({ date: '2025-01-01', amount: 1000 });
  });
});

describe('computePortfolioXirr', () => {
  it('produces portfolio summary and sorted holding returns', () => {
    const logs = [
      { date: '2024-01-01', symbol: 'INFY', action: 'BUY', quantity: 10, price: 1500, fees: 0 },
      { date: '2024-01-01', symbol: 'TCS', action: 'BUY', quantity: 5, price: 3000, fees: 0 },
    ];
    const holdings = [
      { symbol: 'INFY', current_value: 18000 },
      { symbol: 'TCS', current_value: 16500 },
    ];

    const result = computePortfolioXirr(logs, holdings, '2025-01-01');

    expect(result.totalInvested).toBe(30000);
    expect(result.currentPortfolioValue).toBe(34500);
    expect(result.portfolioXirrPct).not.toBeNull();
    expect(result.portfolioXirrPct).toBeGreaterThan(10);
    expect(result.holdings).toHaveLength(2);
    expect(result.holdings[0]!.symbol).toBe('INFY'); // higher return sorted first
  });
});
