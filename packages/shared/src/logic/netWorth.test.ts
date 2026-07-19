import { describe, expect, it } from 'vitest';
import { calculateAccountBalances, calculateNetWorth } from './netWorth';

describe('calculateAccountBalances', () => {
  it('applies opening balance with no transactions', () => {
    const result = calculateAccountBalances([{ id: 'a1', opening_balance: 1000 }], []);
    expect(result).toEqual([{ accountId: 'a1', balance: 1000 }]);
  });

  it('adds income and subtracts expense from the affected account', () => {
    const result = calculateAccountBalances(
      [{ id: 'a1', opening_balance: 0 }],
      [
        { type: 'Income', amount: 500, from_account_id: 'a1', to_account_id: null },
        { type: 'Expense', amount: 200, from_account_id: 'a1', to_account_id: null },
      ]
    );
    expect(result).toEqual([{ accountId: 'a1', balance: 300 }]);
  });

  it('moves money between accounts on transfer', () => {
    const result = calculateAccountBalances(
      [
        { id: 'a1', opening_balance: 1000 },
        { id: 'a2', opening_balance: 0 },
      ],
      [{ type: 'Transfer', amount: 300, from_account_id: 'a1', to_account_id: 'a2' }]
    );
    expect(result).toEqual([
      { accountId: 'a1', balance: 700 },
      { accountId: 'a2', balance: 300 },
    ]);
  });

  it('allows a balance to go negative (overdrawn account)', () => {
    const result = calculateAccountBalances(
      [{ id: 'a1', opening_balance: 100 }],
      [{ type: 'Expense', amount: 500, from_account_id: 'a1', to_account_id: null }]
    );
    expect(result).toEqual([{ accountId: 'a1', balance: -400 }]);
  });
});

describe('calculateNetWorth', () => {
  it('sums assets and portfolio, subtracts liabilities', () => {
    const result = calculateNetWorth({
      accountBalances: [1000, 500],
      activeFixedDeposits: [{ principal: 2000 }],
      goldHoldings: [{ grams: 10, rate_per_gram: 6000 }],
      portfolioCurrentValue: 3000,
      liabilities: [{ outstanding: 1500 }],
    });

    expect(result.cashAndBankTotal).toBe(1500);
    expect(result.fixedDepositsTotal).toBe(2000);
    expect(result.goldTotal).toBe(60000);
    expect(result.portfolioValue).toBe(3000);
    expect(result.liabilitiesTotal).toBe(1500);
    expect(result.netWorth).toBe(1500 + 2000 + 60000 + 3000 - 1500);
  });

  it('returns zero net worth for an all-zero input', () => {
    const result = calculateNetWorth({
      accountBalances: [],
      activeFixedDeposits: [],
      goldHoldings: [],
      portfolioCurrentValue: 0,
      liabilities: [],
    });
    expect(result.netWorth).toBe(0);
  });

  it('goes negative when liabilities exceed assets', () => {
    const result = calculateNetWorth({
      accountBalances: [100],
      activeFixedDeposits: [],
      goldHoldings: [],
      portfolioCurrentValue: 0,
      liabilities: [{ outstanding: 5000 }],
    });
    expect(result.netWorth).toBe(-4900);
  });
});
