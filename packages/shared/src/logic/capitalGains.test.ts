import { describe, expect, it } from 'vitest';
import {
  getFinancialYear,
  calculateHoldingDays,
  classifyTaxType,
  computeCapitalGains,
  type InvestmentLogLike,
} from './capitalGains';

describe('getFinancialYear', () => {
  it('correctly maps dates from April to December to FY year-(year+1)', () => {
    expect(getFinancialYear('2024-04-01')).toBe('FY 2024-25');
    expect(getFinancialYear('2024-07-23')).toBe('FY 2024-25');
    expect(getFinancialYear('2024-12-31')).toBe('FY 2024-25');
  });

  it('correctly maps dates from January to March to FY (year-1)-year', () => {
    expect(getFinancialYear('2025-01-01')).toBe('FY 2024-25');
    expect(getFinancialYear('2025-03-31')).toBe('FY 2024-25');
    expect(getFinancialYear('2026-02-15')).toBe('FY 2025-26');
  });
});

describe('calculateHoldingDays', () => {
  it('calculates exact day difference', () => {
    expect(calculateHoldingDays('2024-01-01', '2024-01-11')).toBe(10);
    expect(calculateHoldingDays('2024-01-01', '2025-01-01')).toBe(366); // 2024 is a leap year
  });
});

describe('classifyTaxType', () => {
  it('classifies Equity <= 365 days as STCG and > 365 days as LTCG', () => {
    expect(classifyTaxType('Stock', 100)).toBe('STCG');
    expect(classifyTaxType('Stock', 365)).toBe('STCG');
    expect(classifyTaxType('Stock', 366)).toBe('LTCG');
    expect(classifyTaxType('ETF', 400)).toBe('LTCG');
  });

  it('classifies Debt / Non-Equity <= 1095 days as STCG and > 1095 as LTCG', () => {
    expect(classifyTaxType('Bond', 400)).toBe('STCG');
    expect(classifyTaxType('Other', 1095)).toBe('STCG');
    expect(classifyTaxType('Bond', 1096)).toBe('LTCG');
  });
});

describe('computeCapitalGains', () => {
  it('matches single BUY and SELL with FIFO', () => {
    const logs: InvestmentLogLike[] = [
      { date: '2024-05-01', symbol: 'TCS', action: 'BUY', quantity: 10, price: 3000, fees: 50, asset_type: 'Stock' },
      { date: '2024-08-01', symbol: 'TCS', action: 'SELL', quantity: 10, price: 3500, fees: 50, asset_type: 'Stock' },
    ];

    const result = computeCapitalGains(logs);
    expect(result.availableFYs).toEqual(['FY 2024-25']);
    const summary = result.summariesByFY['FY 2024-25']!;

    expect(summary.trades).toHaveLength(1);
    expect(summary.trades[0]!.quantity).toBe(10);
    expect(summary.trades[0]!.buyCost).toBe(30050);
    expect(summary.trades[0]!.sellProceeds).toBe(34950);
    expect(summary.trades[0]!.gain).toBe(4900);
    expect(summary.trades[0]!.taxType).toBe('STCG');
    expect(summary.netStcg).toBe(4900);
    expect(summary.netLtcg).toBe(0);
  });

  it('matches multiple partial BUY lots via FIFO', () => {
    const logs: InvestmentLogLike[] = [
      { date: '2023-01-10', symbol: 'INFY', action: 'BUY', quantity: 10, price: 1400, fees: 0, asset_type: 'Stock' },
      { date: '2024-02-15', symbol: 'INFY', action: 'BUY', quantity: 20, price: 1500, fees: 0, asset_type: 'Stock' },
      { date: '2024-06-20', symbol: 'INFY', action: 'SELL', quantity: 15, price: 1600, fees: 0, asset_type: 'Stock' },
    ];

    const result = computeCapitalGains(logs);
    const summary = result.summariesByFY['FY 2024-25']!;

    // 15 units sold should match:
    // 1. 10 units from 2023-01-10 (holding > 365 days -> LTCG)
    // 2. 5 units from 2024-02-15 (holding < 365 days -> STCG)
    expect(summary.trades).toHaveLength(2);

    const ltcgTrade = summary.trades[0]!;
    expect(ltcgTrade.quantity).toBe(10);
    expect(ltcgTrade.buyPrice).toBe(1400);
    expect(ltcgTrade.sellPrice).toBe(1600);
    expect(ltcgTrade.gain).toBe(2000);
    expect(ltcgTrade.taxType).toBe('LTCG');

    const stcgTrade = summary.trades[1]!;
    expect(stcgTrade.quantity).toBe(5);
    expect(stcgTrade.buyPrice).toBe(1500);
    expect(stcgTrade.sellPrice).toBe(1600);
    expect(stcgTrade.gain).toBe(500);
    expect(stcgTrade.taxType).toBe('STCG');

    expect(summary.netLtcg).toBe(2000);
    expect(summary.netStcg).toBe(500);
    expect(summary.totalNetGains).toBe(2500);
  });

  it('correctly tracks losses and nets them out per tax category', () => {
    const logs: InvestmentLogLike[] = [
      { date: '2024-05-01', symbol: 'RELIANCE', action: 'BUY', quantity: 10, price: 3000, fees: 0, asset_type: 'Stock' },
      { date: '2024-06-01', symbol: 'RELIANCE', action: 'SELL', quantity: 10, price: 2800, fees: 0, asset_type: 'Stock' },
      { date: '2024-07-01', symbol: 'HDFC', action: 'BUY', quantity: 10, price: 1500, fees: 0, asset_type: 'Stock' },
      { date: '2024-08-01', symbol: 'HDFC', action: 'SELL', quantity: 10, price: 1700, fees: 0, asset_type: 'Stock' },
    ];

    const result = computeCapitalGains(logs);
    const summary = result.summariesByFY['FY 2024-25']!;

    expect(summary.stcgLosses).toBe(2000);
    expect(summary.stcgGains).toBe(2000);
    expect(summary.netStcg).toBe(0);
    expect(summary.totalNetGains).toBe(0);
  });

  it('returns empty result when no SELL transactions exist', () => {
    const logs: InvestmentLogLike[] = [
      { date: '2024-05-01', symbol: 'TCS', action: 'BUY', quantity: 10, price: 3000, fees: 0, asset_type: 'Stock' },
    ];

    const result = computeCapitalGains(logs);
    expect(result.allTrades).toHaveLength(0);
    expect(result.availableFYs).toHaveLength(0);
  });
});
