import { describe, expect, it } from 'vitest';
import { computeNextRunDate, getDueOccurrences } from './recurring';

describe('computeNextRunDate', () => {
  it('advances weekly by 7 days, across a month boundary', () => {
    expect(computeNextRunDate('2026-01-28', 'Weekly')).toBe('2026-02-04');
  });

  it('advances monthly, keeping the same day', () => {
    expect(computeNextRunDate('2026-03-15', 'Monthly')).toBe('2026-04-15');
  });

  it('clamps the day when the next month is shorter (Jan 31 -> Feb 28)', () => {
    expect(computeNextRunDate('2026-01-31', 'Monthly')).toBe('2026-02-28');
  });

  it('clamps to Feb 29 on a leap year', () => {
    expect(computeNextRunDate('2028-01-31', 'Monthly')).toBe('2028-02-29');
  });

  it('advances quarterly and rolls the year over when needed', () => {
    expect(computeNextRunDate('2026-11-30', 'Quarterly')).toBe('2027-02-28');
  });

  it('advances yearly, clamping Feb 29 to Feb 28 on a non-leap target year', () => {
    expect(computeNextRunDate('2028-02-29', 'Yearly')).toBe('2029-02-28');
  });

  it('rolls December monthly into next January', () => {
    expect(computeNextRunDate('2026-12-10', 'Monthly')).toBe('2027-01-10');
  });
});

describe('getDueOccurrences', () => {
  it('returns nothing when the rule is not due yet', () => {
    const result = getDueOccurrences('2026-09-01', 'Monthly', '2026-08-15');
    expect(result.occurrenceDates).toEqual([]);
    expect(result.nextRunDate).toBe('2026-09-01');
  });

  it('returns exactly one occurrence when due today', () => {
    const result = getDueOccurrences('2026-08-15', 'Monthly', '2026-08-15');
    expect(result.occurrenceDates).toEqual(['2026-08-15']);
    expect(result.nextRunDate).toBe('2026-09-15');
  });

  it('catches up multiple missed months in order, oldest first', () => {
    const result = getDueOccurrences('2026-05-01', 'Monthly', '2026-08-15');
    expect(result.occurrenceDates).toEqual(['2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01']);
    expect(result.nextRunDate).toBe('2026-09-01');
  });

  it('caps catch-up so a stale weekly rule cannot generate unbounded rows', () => {
    const result = getDueOccurrences('2020-01-01', 'Weekly', '2026-08-15');
    expect(result.occurrenceDates.length).toBe(24);
  });
});
