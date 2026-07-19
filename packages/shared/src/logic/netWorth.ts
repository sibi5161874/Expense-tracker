/**
 * Net worth logic per DATA_MODEL.md §8: "Net worth = sum(assets) + sum(portfolio
 * current value) − sum(liabilities outstanding)". Assets = cash/bank account
 * balances + fixed deposit principal (unwithdrawn) + gold current value.
 */

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
    portfolioValue: params.portfolioCurrentValue,
    liabilitiesTotal,
    netWorth,
  };
}
