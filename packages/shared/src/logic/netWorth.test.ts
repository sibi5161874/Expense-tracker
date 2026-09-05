import { describe, expect, it } from 'vitest';
import {
  calculateAccountBalances,
  calculateNetWorth,
  buildSnapshotFromBreakdown,
  calculateSnapshotGrowthPct,
  convertAccountBalancesToBase,
  filterSnapshotsByRange,
} from './netWorth';

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

  it('includes real estate current value and PPF balance in the total', () => {
    const result = calculateNetWorth({
      accountBalances: [],
      activeFixedDeposits: [],
      goldHoldings: [],
      realEstate: [{ current_value: 5_000_000 }],
      ppfAccounts: [{ current_balance: 300_000 }],
      portfolioCurrentValue: 0,
      liabilities: [],
    });
    expect(result.realEstateTotal).toBe(5_000_000);
    expect(result.ppfTotal).toBe(300_000);
    expect(result.netWorth).toBe(5_300_000);
  });

  it('includes RD (at maturity value), NSC (at purchase value), and vehicles (at current value)', () => {
    const result = calculateNetWorth({
      accountBalances: [],
      activeFixedDeposits: [],
      goldHoldings: [],
      recurringDeposits: [{ maturity_value: 120_000 }],
      nscCertificates: [{ purchase_value: 50_000 }],
      vehicles: [{ current_value: 400_000 }],
      portfolioCurrentValue: 0,
      liabilities: [],
    });
    expect(result.recurringDepositsTotal).toBe(120_000);
    expect(result.nscTotal).toBe(50_000);
    expect(result.vehiclesTotal).toBe(400_000);
    expect(result.netWorth).toBe(570_000);
  });
});

describe('buildSnapshotFromBreakdown', () => {
  it('maps every breakdown field to its snapshot column', () => {
    const breakdown = calculateNetWorth({
      accountBalances: [1000],
      activeFixedDeposits: [{ principal: 2000 }],
      goldHoldings: [{ grams: 10, rate_per_gram: 6000 }],
      realEstate: [{ current_value: 5_000_000 }],
      ppfAccounts: [{ current_balance: 300_000 }],
      portfolioCurrentValue: 3000,
      liabilities: [{ outstanding: 1500 }],
    });
    const snapshot = buildSnapshotFromBreakdown(breakdown, '2026-08-15');

    expect(snapshot.snapshot_date).toBe('2026-08-15');
    expect(snapshot.net_worth).toBe(breakdown.netWorth);
    expect(snapshot.real_estate_total).toBe(5_000_000);
    expect(snapshot.ppf_total).toBe(300_000);
    expect(snapshot.liabilities_total).toBe(1500);
  });
});

describe('calculateSnapshotGrowthPct', () => {
  it('computes positive growth', () => {
    expect(calculateSnapshotGrowthPct(110_000, 100_000)).toBe(10);
  });

  it('computes negative growth', () => {
    expect(calculateSnapshotGrowthPct(90_000, 100_000)).toBe(-10);
  });

  it('returns null when there is no previous snapshot', () => {
    expect(calculateSnapshotGrowthPct(100_000, null)).toBeNull();
  });

  it('returns null when the previous net worth was zero (division by zero)', () => {
    expect(calculateSnapshotGrowthPct(50_000, 0)).toBeNull();
  });

  it('handles growth off a negative baseline using absolute value as the base', () => {
    expect(calculateSnapshotGrowthPct(-50_000, -100_000)).toBe(50);
  });
});

describe('filterSnapshotsByRange', () => {
  const NOW = new Date('2026-08-18T00:00:00Z');
  const snapshots = [
    { snapshot_date: '2025-01-01', net_worth: 1 },
    { snapshot_date: '2026-03-01', net_worth: 2 }, // ~170 days ago — inside 6M/1Y, outside 1M/3M
    { snapshot_date: '2026-06-01', net_worth: 3 }, // ~78 days ago — inside 3M/6M/1Y, outside 1M
    { snapshot_date: '2026-08-10', net_worth: 4 }, // 8 days ago — inside every range
  ];

  it('1M keeps only the trailing 30 days', () => {
    const result = filterSnapshotsByRange(snapshots, '1M', NOW);
    expect(result.map((s) => s.snapshot_date)).toEqual(['2026-08-10']);
  });

  it('3M keeps the trailing 90 days', () => {
    const result = filterSnapshotsByRange(snapshots, '3M', NOW);
    expect(result.map((s) => s.snapshot_date)).toEqual(['2026-06-01', '2026-08-10']);
  });

  it('All returns everything unfiltered', () => {
    expect(filterSnapshotsByRange(snapshots, 'All', NOW)).toHaveLength(4);
  });
});

describe('convertAccountBalancesToBase', () => {
  const accounts = [
    { id: 'acc-inr', currency: 'INR' },
    { id: 'acc-usd', currency: 'USD' },
    { id: 'acc-aed', currency: 'AED' },
  ];
  const rates = { USD: 0.012 }; // no AED rate available

  it('passes INR balances through unchanged', () => {
    const result = convertAccountBalancesToBase([{ accountId: 'acc-inr', balance: 1000 }], accounts, rates);
    expect(result.convertedBalances).toEqual([1000]);
    expect(result.unconvertedCurrencies).toEqual([]);
  });

  it('converts a foreign-currency balance to INR', () => {
    const result = convertAccountBalancesToBase([{ accountId: 'acc-usd', balance: 100 }], accounts, rates);
    expect(result.convertedBalances[0]).toBeCloseTo(8333.33, 1);
  });

  it('excludes a balance whose currency has no rate, rather than treating it as 0', () => {
    const result = convertAccountBalancesToBase(
      [
        { accountId: 'acc-inr', balance: 1000 },
        { accountId: 'acc-aed', balance: 500 },
      ],
      accounts,
      rates
    );
    expect(result.convertedBalances).toEqual([1000]);
    expect(result.unconvertedCurrencies).toEqual(['AED']);
  });

  it('treats an unknown account id as INR rather than throwing (defensive default)', () => {
    const result = convertAccountBalancesToBase([{ accountId: 'unknown-id', balance: 500 }], accounts, rates);
    expect(result.convertedBalances).toEqual([500]);
  });

  it('feeds straight into calculateNetWorth without any further transformation', () => {
    const { convertedBalances } = convertAccountBalancesToBase(
      [
        { accountId: 'acc-inr', balance: 1000 },
        { accountId: 'acc-usd', balance: 100 },
      ],
      accounts,
      rates
    );
    const netWorth = calculateNetWorth({
      accountBalances: convertedBalances,
      activeFixedDeposits: [],
      goldHoldings: [],
      portfolioCurrentValue: 0,
      liabilities: [],
    });
    expect(netWorth.cashAndBankTotal).toBeCloseTo(1000 + 8333.33, 1);
  });
});
