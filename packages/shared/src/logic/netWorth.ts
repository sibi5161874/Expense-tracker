/**
 * Net worth logic per DATA_MODEL.md §8: "Net worth = sum(assets) + sum(portfolio
 * current value) − sum(liabilities outstanding)". Assets = cash/bank account
 * balances + fixed deposit principal (unwithdrawn) + gold current value.
 */

import { convertToBaseCurrency, type FxRates } from './fx';

export interface AccountBalance {
  accountId: string;
  balance: number;
}

/**
 * Running balance per account = opening_balance, adjusted by every transaction:
 * Income/Expense affect from_account_id; Transfer debits from_account_id and
 * credits to_account_id.
 */
export function calculateAccountBalances(
  accounts: Array<{ id: string; opening_balance: number }>,
  transactions: Array<{
    type: 'Income' | 'Expense' | 'Transfer';
    amount: number;
    from_account_id: string;
    to_account_id: string | null;
  }>
): AccountBalance[] {
  const balances = new Map<string, number>();
  for (const acc of accounts) balances.set(acc.id, acc.opening_balance);

  for (const t of transactions) {
    if (t.type === 'Income') {
      balances.set(t.from_account_id, (balances.get(t.from_account_id) ?? 0) + t.amount);
    } else if (t.type === 'Expense') {
      balances.set(t.from_account_id, (balances.get(t.from_account_id) ?? 0) - t.amount);
    } else {
      balances.set(t.from_account_id, (balances.get(t.from_account_id) ?? 0) - t.amount);
      if (t.to_account_id) {
        balances.set(t.to_account_id, (balances.get(t.to_account_id) ?? 0) + t.amount);
      }
    }
  }

  return Array.from(balances, ([accountId, balance]) => ({ accountId, balance }));
}

export interface NetWorthBreakdown {
  cashAndBankTotal: number;
  fixedDepositsTotal: number;
  goldTotal: number;
  epfTotal: number;
  npsTotal: number;
  ssyTotal: number;
  sgbTotal: number;
  ulipTotal: number;
  realEstateTotal: number;
  ppfTotal: number;
  recurringDepositsTotal: number;
  nscTotal: number;
  vehiclesTotal: number;
  cryptoTotal: number;
  portfolioValue: number;
  liabilitiesTotal: number;
  netWorth: number;
}

export function calculateNetWorth(params: {
  accountBalances: number[];
  activeFixedDeposits: Array<{ principal: number }>;
  goldHoldings: Array<{ grams: number; rate_per_gram: number }>;
  epfAccounts?: Array<{ current_balance: number }>;
  npsAccounts?: Array<{ current_value: number }>;
  ssyAccounts?: Array<{ current_balance: number }>;
  sgbHoldings?: Array<{ units_held: number; rate_per_gram: number }>;
  ulipPolicies?: Array<{ current_fund_value: number }>;
  realEstate?: Array<{ current_value: number }>;
  ppfAccounts?: Array<{ current_balance: number }>;
  recurringDeposits?: Array<{ maturity_value: number }>;
  nscCertificates?: Array<{ purchase_value: number }>;
  vehicles?: Array<{ current_value: number }>;
  cryptoAssets?: Array<{ quantity: number; current_price: number }>;
  portfolioCurrentValue: number;
  liabilities: Array<{ outstanding: number }>;
}): NetWorthBreakdown {
  const cashAndBankTotal = params.accountBalances.reduce((sum, b) => sum + b, 0);
  const fixedDepositsTotal = params.activeFixedDeposits.reduce((sum, fd) => sum + fd.principal, 0);
  const goldTotal = params.goldHoldings.reduce((sum, g) => sum + g.grams * g.rate_per_gram, 0);
  const epfTotal = (params.epfAccounts ?? []).reduce((sum, e) => sum + e.current_balance, 0);
  const npsTotal = (params.npsAccounts ?? []).reduce((sum, n) => sum + n.current_value, 0);
  const ssyTotal = (params.ssyAccounts ?? []).reduce((sum, s) => sum + s.current_balance, 0);
  const sgbTotal = (params.sgbHoldings ?? []).reduce((sum, s) => sum + s.units_held * s.rate_per_gram, 0);
  // ULIP's sum_assured (insurance cover) is deliberately excluded — only the
  // investment component (current_fund_value) counts toward net worth.
  const ulipTotal = (params.ulipPolicies ?? []).reduce((sum, u) => sum + u.current_fund_value, 0);
  const realEstateTotal = (params.realEstate ?? []).reduce((sum, r) => sum + r.current_value, 0);
  const ppfTotal = (params.ppfAccounts ?? []).reduce((sum, p) => sum + p.current_balance, 0);
  // RD is valued at maturity_value (its contracted payout) to match how FDs are
  // treated here; NSC uses purchase_value since its accrued interest isn't tracked
  // per-year. Both are deliberately conservative rather than estimating accruals.
  const recurringDepositsTotal = (params.recurringDeposits ?? []).reduce((sum, r) => sum + r.maturity_value, 0);
  const nscTotal = (params.nscCertificates ?? []).reduce((sum, n) => sum + n.purchase_value, 0);
  const vehiclesTotal = (params.vehicles ?? []).reduce((sum, v) => sum + v.current_value, 0);
  const cryptoTotal = (params.cryptoAssets ?? []).reduce((sum, c) => sum + c.quantity * c.current_price, 0);
  const liabilitiesTotal = params.liabilities.reduce((sum, l) => sum + l.outstanding, 0);
  const netWorth =
    cashAndBankTotal +
    fixedDepositsTotal +
    goldTotal +
    epfTotal +
    npsTotal +
    ssyTotal +
    sgbTotal +
    ulipTotal +
    realEstateTotal +
    ppfTotal +
    recurringDepositsTotal +
    nscTotal +
    vehiclesTotal +
    cryptoTotal +
    params.portfolioCurrentValue -
    liabilitiesTotal;

  return {
    cashAndBankTotal,
    fixedDepositsTotal,
    goldTotal,
    epfTotal,
    npsTotal,
    ssyTotal,
    sgbTotal,
    ulipTotal,
    realEstateTotal,
    ppfTotal,
    recurringDepositsTotal,
    nscTotal,
    vehiclesTotal,
    cryptoTotal,
    portfolioValue: params.portfolioCurrentValue,
    liabilitiesTotal,
    netWorth,
  };
}

export interface NetWorthSnapshotFields {
  snapshot_date: string;
  cash_and_bank_total: number;
  fixed_deposits_total: number;
  gold_total: number;
  epf_total: number;
  nps_total: number;
  ssy_total: number;
  sgb_total: number;
  ulip_total: number;
  real_estate_total: number;
  ppf_total: number;
  recurring_deposits_total: number;
  nsc_total: number;
  vehicles_total: number;
  crypto_total?: number;
  portfolio_value: number;
  liabilities_total: number;
  net_worth: number;
}

/** Maps a live NetWorthBreakdown into a snapshot row ready to save — "Take Snapshot" freezes today's numbers as-is. */
export function buildSnapshotFromBreakdown(breakdown: NetWorthBreakdown, snapshotDate: string): NetWorthSnapshotFields {
  return {
    snapshot_date: snapshotDate,
    cash_and_bank_total: breakdown.cashAndBankTotal,
    fixed_deposits_total: breakdown.fixedDepositsTotal,
    gold_total: breakdown.goldTotal,
    epf_total: breakdown.epfTotal,
    nps_total: breakdown.npsTotal,
    ssy_total: breakdown.ssyTotal,
    sgb_total: breakdown.sgbTotal,
    ulip_total: breakdown.ulipTotal,
    real_estate_total: breakdown.realEstateTotal,
    ppf_total: breakdown.ppfTotal,
    recurring_deposits_total: breakdown.recurringDepositsTotal,
    nsc_total: breakdown.nscTotal,
    vehicles_total: breakdown.vehiclesTotal,
    crypto_total: breakdown.cryptoTotal,
    portfolio_value: breakdown.portfolioValue,
    liabilities_total: breakdown.liabilitiesTotal,
    net_worth: breakdown.netWorth,
  };
}


/** % change between two snapshots' net worth — null when there's nothing to compare against (first-ever snapshot, or a zero baseline). */
export function calculateSnapshotGrowthPct(currentNetWorth: number, previousNetWorth: number | null): number | null {
  if (previousNetWorth === null || previousNetWorth === 0) return null;
  return Math.round(((currentNetWorth - previousNetWorth) / Math.abs(previousNetWorth)) * 1000) / 10;
}

export type NetWorthHistoryRange = '1M' | '3M' | '6M' | '1Y' | 'All';

const RANGE_DAYS: Record<Exclude<NetWorthHistoryRange, 'All'>, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
};

/** Filters snapshots to the trailing N days for every range except 'All' (no filtering — the full history). `now` is injectable for tests; snapshots are assumed already sorted ascending by date, so this only needs to find the cutoff, not re-sort. */
export function filterSnapshotsByRange<T extends { snapshot_date: string }>(
  snapshots: T[],
  range: NetWorthHistoryRange,
  now: Date = new Date()
): T[] {
  if (range === 'All') return snapshots;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range]);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return snapshots.filter((s) => s.snapshot_date >= cutoffStr);
}

export interface AccountBalanceConversion {
  /** Ready to sum straight into calculateNetWorth's accountBalances param. */
  convertedBalances: number[];
  /** Currencies that had a balance but no usable FX rate — excluded above, not zeroed. */
  unconvertedCurrencies: string[];
}

/**
 * Converts each account's own-currency balance to INR before it's summed into
 * net worth. `accounts.currency` already existed in the schema (default 'INR')
 * but was never read for conversion — every balance was implicitly treated as
 * INR regardless of what was recorded. This is the one place that changes.
 *
 * An account whose currency has no matching rate is excluded from the total
 * rather than contributing 0 — the caller (useNetWorth) surfaces
 * `unconvertedCurrencies` so the UI can say "1 AED account not counted" instead
 * of silently understating net worth.
 */
export function convertAccountBalancesToBase(
  balances: AccountBalance[],
  accounts: Array<{ id: string; currency: string }>,
  rates: FxRates
): AccountBalanceConversion {
  const currencyByAccount = new Map(accounts.map((a) => [a.id, a.currency]));
  const convertedBalances: number[] = [];
  const unconverted = new Set<string>();

  for (const b of balances) {
    const currency = currencyByAccount.get(b.accountId) ?? 'INR';
    const converted = convertToBaseCurrency(b.balance, currency, rates);
    if (converted === null) {
      unconverted.add(currency);
      continue;
    }
    convertedBalances.push(converted);
  }

  return { convertedBalances, unconvertedCurrencies: [...unconverted] };
}
