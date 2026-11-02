import { describe, it, expect } from 'vitest';
import {
  buildInvestmentLogMirrorTransaction,
  INVESTMENT_EXPENSE_CATEGORY_NAME,
  INVESTMENT_INCOME_CATEGORY_NAME,
} from './investmentMirroring';

const base = {
  date: '2026-01-05',
  symbol: 'RELIANCE',
  quantity: 10,
  price: 2500,
  fees: 20,
  linked_account_id: 'account-1',
};

describe('buildInvestmentLogMirrorTransaction', () => {
  it('mirrors a BUY as an Expense for quantity*price + fees', () => {
    const result = buildInvestmentLogMirrorTransaction({ ...base, action: 'BUY' });
    expect(result).toEqual({
      date: '2026-01-05',
      type: 'Expense',
      amount: 25020,
      from_account_id: 'account-1',
      notes: 'Bought 10 RELIANCE @ ₹2500 via Investment Log',
      categoryName: INVESTMENT_EXPENSE_CATEGORY_NAME,
      categoryType: 'Expense',
    });
  });

  it('mirrors a SIP the same way as a BUY', () => {
    const result = buildInvestmentLogMirrorTransaction({ ...base, action: 'SIP' });
    expect(result?.type).toBe('Expense');
    expect(result?.amount).toBe(25020);
  });

  it('mirrors a SELL as Income for quantity*price - fees', () => {
    const result = buildInvestmentLogMirrorTransaction({ ...base, action: 'SELL' });
    expect(result).toEqual({
      date: '2026-01-05',
      type: 'Income',
      amount: 24980,
      from_account_id: 'account-1',
      notes: 'Sold 10 RELIANCE @ ₹2500 via Investment Log',
      categoryName: INVESTMENT_INCOME_CATEGORY_NAME,
      categoryType: 'Income',
    });
  });

  it('mirrors a DIVIDEND the same way as a SELL', () => {
    const result = buildInvestmentLogMirrorTransaction({ ...base, action: 'DIVIDEND' });
    expect(result?.type).toBe('Income');
    expect(result?.notes).toContain('Received dividend on');
  });

  it('never mirrors a BONUS — no cash changes hands', () => {
    expect(buildInvestmentLogMirrorTransaction({ ...base, action: 'BONUS' })).toBeNull();
  });

  it('never mirrors a SPLIT — no cash changes hands', () => {
    expect(buildInvestmentLogMirrorTransaction({ ...base, action: 'SPLIT' })).toBeNull();
  });

  it('never mirrors when no account is linked', () => {
    expect(
      buildInvestmentLogMirrorTransaction({ ...base, action: 'BUY', linked_account_id: '' })
    ).toBeNull();
  });

  it('never mirrors a SELL/DIVIDEND whose fees would leave a non-positive amount', () => {
    expect(
      buildInvestmentLogMirrorTransaction({ ...base, action: 'SELL', quantity: 1, price: 10, fees: 50 })
    ).toBeNull();
  });
});
