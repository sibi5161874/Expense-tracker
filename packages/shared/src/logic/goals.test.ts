import { describe, expect, it } from 'vitest';
import {
  calculateProgressPct,
  calculateSipNeededPerMonth,
  calculateGoalStatus,
  calculateInflatedFutureValue,
} from './goals';

describe('calculateProgressPct', () => {
  it('computes saved / target', () => {
    expect(calculateProgressPct(25_000, 100_000)).toBe(0.25);
  });

  it('is 0 when target is 0 (avoids division by zero)', () => {
    expect(calculateProgressPct(5_000, 0)).toBe(0);
  });
});

describe('calculateSipNeededPerMonth', () => {
  it('is 0 once the goal is already fully saved', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(calculateSipNeededPerMonth(100_000, 150_000, future.toISOString().slice(0, 10))).toBe(0);
  });
});

describe('calculateGoalStatus', () => {
  const future = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  };
  const past = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  };

  it('is Achieved once saved meets or exceeds target, regardless of date', () => {
    expect(calculateGoalStatus(100_000, 100_000, past())).toBe('Achieved');
  });

  it('is Overdue when the target date has passed and the goal is short', () => {
    expect(calculateGoalStatus(50_000, 100_000, past())).toBe('Overdue');
  });

  it('is On Track at 75%+ progress before the target date', () => {
    expect(calculateGoalStatus(80_000, 100_000, future())).toBe('On Track');
  });

  it('is Behind under 75% progress before the target date', () => {
    expect(calculateGoalStatus(20_000, 100_000, future())).toBe('Behind');
  });
});

describe('calculateInflatedFutureValue', () => {
  // Years are measured as ms-elapsed / 365.25 days (accounts for leap years on
  // average), so a calendar "5 years" is a hair under 5.0 — assert against that
  // same formula rather than assuming an exact integer year count.
  function expectedFv(presentValue: number, rate: number, from: string, to: string): number {
    const years = (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.round(presentValue * Math.pow(1 + rate, years));
  }

  it('compounds a present value at 12% by default over whole years', () => {
    const result = calculateInflatedFutureValue(5_000_000, '2031-01-01', undefined, new Date('2026-01-01'));
    expect(result).toBe(expectedFv(5_000_000, 0.12, '2026-01-01', '2031-01-01'));
  });

  it('accepts a custom inflation rate', () => {
    const result = calculateInflatedFutureValue(1_000_000, '2027-01-01', 0.06, new Date('2026-01-01'));
    expect(result).toBe(expectedFv(1_000_000, 0.06, '2026-01-01', '2027-01-01'));
  });

  it('returns the present value unchanged when the target date has already passed', () => {
    const today = new Date('2026-01-01');
    const result = calculateInflatedFutureValue(1_000_000, '2020-01-01', undefined, today);
    expect(result).toBe(1_000_000);
  });

  it('returns 0 for a 0 present value', () => {
    const today = new Date('2026-01-01');
    expect(calculateInflatedFutureValue(0, '2031-01-01', undefined, today)).toBe(0);
  });
});
