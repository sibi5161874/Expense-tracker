import { describe, it, expect } from 'vitest';
import { isOperationalTransaction, CAPITAL_TRANSFER_CATEGORY_NAMES } from './operationalTransactions';

describe('isOperationalTransaction', () => {
  it('treats an uncategorized transaction as operational', () => {
    expect(isOperationalTransaction({ category: null })).toBe(true);
    expect(isOperationalTransaction({})).toBe(true);
  });

  it('treats a regular category (groceries, salary, etc.) as operational', () => {
    expect(isOperationalTransaction({ category: { name: 'Groceries' } })).toBe(true);
  });

  it.each(CAPITAL_TRANSFER_CATEGORY_NAMES)('excludes the %s mirror category', (name) => {
    expect(isOperationalTransaction({ category: { name } })).toBe(false);
  });

  it('lists exactly the 4 known mirror categories', () => {
    expect(CAPITAL_TRANSFER_CATEGORY_NAMES).toEqual([
      'Investments',
      'Investment Returns',
      'Cashbook Given',
      'Cashbook Received',
    ]);
  });
});
