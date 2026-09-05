import { describe, expect, it } from 'vitest';
import { calculateSipFutureValue, calculateLumpsumFutureValue, calculatePnL } from './calculators';

describe('calculateSipFutureValue', () => {
  it('matches the standard SIP FV formula', () => {
    // P=10000, annual 12% -> monthly 1%, n=12
    const fv = calculateSipFutureValue(10000, 12, 1);
    const r = 0.01;
    const expected = 10000 * ((Math.pow(1 + r, 12) - 1) / r) * (1 + r);
    expect(fv).toBeCloseTo(expected, 5);
  });

  it('is simple multiplication at 0% interest', () => {
    expect(calculateSipFutureValue(5000, 0, 2)).toBe(5000 * 24);
  });
});

describe('calculateLumpsumFutureValue', () => {
  it('matches P × (1+r)^n', () => {
    expect(calculateLumpsumFutureValue(100000, 10, 5)).toBeCloseTo(100000 * Math.pow(1.1, 5), 5);
  });

  it('is unchanged at 0% interest', () => {
    expect(calculateLumpsumFutureValue(50000, 0, 10)).toBe(50000);
  });
});

describe('calculatePnL', () => {
  it('computes total P&L and % return for a gain', () => {
    const result = calculatePnL(100, 10, 150);
    expect(result.totalPnl).toBe(500);
    expect(result.pctReturn).toBe(50);
    expect(result.breakEvenPrice).toBe(100);
  });

  it('computes a loss correctly', () => {
    const result = calculatePnL(200, 5, 150);
    expect(result.totalPnl).toBe(-250);
    expect(result.pctReturn).toBe(-25);
  });

  it('does not divide by zero for a zero buy price', () => {
    expect(calculatePnL(0, 10, 50).pctReturn).toBe(0);
  });
});
