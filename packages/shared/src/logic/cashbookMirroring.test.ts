import { describe, it, expect } from 'vitest';
import { buildCashbookMirrorTransaction } from './cashbookMirroring';

const base = {
  date: '2026-01-05',
  counterparty: 'Ravi',
  amount: 5000,
  account_used_id: 'account-1',
};

describe('buildCashbookMirrorTransaction', () => {
  it('mirrors "Gave" as an Expense from the account used', () => {
    const result = buildCashbookMirrorTransaction({ ...base, flow: 'Gave' });
    expect(result).toEqual({
      date: '2026-01-05',
      type: 'Expense',
      amount: 5000,
      from_account_id: 'account-1',
      notes: 'Lent to Ravi via Cashbook',
    });
  });

  it('mirrors "Received" as Income into the account used', () => {
    const result = buildCashbookMirrorTransaction({ ...base, flow: 'Received' });
    expect(result).toEqual({
      date: '2026-01-05',
      type: 'Income',
      amount: 5000,
      from_account_id: 'account-1',
      notes: 'Borrowed from Ravi via Cashbook',
    });
  });

  it('never mirrors when no account was used', () => {
    expect(buildCashbookMirrorTransaction({ ...base, flow: 'Gave', account_used_id: null })).toBeNull();
  });

  it('never mirrors a non-positive amount', () => {
    expect(buildCashbookMirrorTransaction({ ...base, flow: 'Gave', amount: 0 })).toBeNull();
  });
});
