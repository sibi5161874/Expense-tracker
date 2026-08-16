import { describe, expect, it } from 'vitest';
import { calculateBudgetStatus, suggestBudgetAmount, type SpendTransaction } from './budget';

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

describe('suggestBudgetAmount', () => {
  const asOf = new Date('2026-08-15');

  function expenseTxn(date: string, amount: number, categoryId = 'groceries'): SpendTransaction {
    return { category_id: categoryId, type: 'Expense', amount, date };
  }

  it('averages expense spend over completed months that had data', () => {
    const transactions: SpendTransaction[] = [
      expenseTxn('2026-07-05', 6000),
      expenseTxn('2026-06-10', 4000),
      expenseTxn('2026-05-20', 5000),
    ];
    expect(suggestBudgetAmount(transactions, 'groceries', 3, asOf)).toBe(5000);
  });

  it('excludes the current, in-progress month', () => {
    const transactions: SpendTransaction[] = [
      expenseTxn('2026-08-01', 999999), // current month — must not affect the average
      expenseTxn('2026-07-05', 4000),
    ];
    expect(suggestBudgetAmount(transactions, 'groceries', 3, asOf)).toBe(4000);
  });

  it('ignores other categories and non-expense transactions', () => {
    const transactions: SpendTransaction[] = [
      expenseTxn('2026-07-05', 4000),
      expenseTxn('2026-07-05', 9000, 'rent'),
      { category_id: 'groceries', type: 'Income', amount: 50000, date: '2026-07-01' },
    ];
    expect(suggestBudgetAmount(transactions, 'groceries', 3, asOf)).toBe(4000);
  });

  it('only averages over months that actually had spend, not the full window', () => {
    const transactions: SpendTransaction[] = [expenseTxn('2026-05-20', 3000)];
    // Window is May-Jul (3 months back), but only May had data — average is over 1 month, not 3.
    expect(suggestBudgetAmount(transactions, 'groceries', 3, asOf)).toBe(3000);
  });

  it('returns null when there is no expense history for the category', () => {
    expect(suggestBudgetAmount([], 'groceries', 3, asOf)).toBeNull();
  });
});
