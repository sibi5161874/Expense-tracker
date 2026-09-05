import { describe, expect, it } from 'vitest';
import { isCoffeeExpense, calculateCoffeeSpend } from './insights';

describe('isCoffeeExpense', () => {
  it('matches any configured keyword, case-insensitively', () => {
    expect(isCoffeeExpense('Swiggy order')).toBe(true);
    expect(isCoffeeExpense('ZOMATO delivery')).toBe(true);
    expect(isCoffeeExpense('Morning coffee run')).toBe(true);
    expect(isCoffeeExpense('Starbucks Koramangala')).toBe(true);
  });

  it('does not match unrelated text', () => {
    expect(isCoffeeExpense('Electricity bill')).toBe(false);
    expect(isCoffeeExpense('')).toBe(false);
  });
});

describe('calculateCoffeeSpend', () => {
  it('sums only Expense transactions matching a keyword', () => {
    const total = calculateCoffeeSpend([
      { type: 'Expense', amount: 300, notes: 'Swiggy' },
      { type: 'Expense', amount: 150, notes: 'Zomato order' },
      { type: 'Expense', amount: 5000, notes: 'Rent' },
      { type: 'Income', amount: 1000, notes: 'Coffee shop refund' },
    ]);
    expect(total).toBe(450);
  });

  it('matches via category or sub-category, not just notes', () => {
    const total = calculateCoffeeSpend([
      { type: 'Expense', amount: 200, category: { name: 'Dining' }, sub_category: 'Starbucks' },
    ]);
    expect(total).toBe(200);
  });

  it('is 0 when nothing matches', () => {
    expect(calculateCoffeeSpend([{ type: 'Expense', amount: 500, notes: 'Groceries' }])).toBe(0);
  });
});
