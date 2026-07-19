import { describe, expect, it } from 'vitest';
import { calculateBudgetStatus } from './budget';

describe('calculateBudgetStatus', () => {
  it('is ok when actual is well under limit', () => {
    expect(calculateBudgetStatus(100, 1000)).toBe('ok');
  });

  it('is warning between 75% and 100% of limit', () => {
    expect(calculateBudgetStatus(750, 1000)).toBe('warning');
    expect(calculateBudgetStatus(999, 1000)).toBe('warning');
  });

  it('is over at or beyond the limit', () => {
    expect(calculateBudgetStatus(1000, 1000)).toBe('over');
    expect(calculateBudgetStatus(1500, 1000)).toBe('over');
  });

  it('treats a zero or negative limit as ok (no limit set)', () => {
    expect(calculateBudgetStatus(500, 0)).toBe('ok');
    expect(calculateBudgetStatus(500, -100)).toBe('ok');
  });

  it('is ok at exactly zero actual spend', () => {
    expect(calculateBudgetStatus(0, 1000)).toBe('ok');
  });
});
