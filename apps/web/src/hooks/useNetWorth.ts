import { useMemo } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { useAllTimeTransactions } from '@/hooks/useReportsData';
import {
  useFixedDeposits,
  useGoldAssets,
  useLoanLiabilities,
  useEpfAccounts,
  useNpsAccounts,
  useSsyAccounts,
  useSgbHoldings,
  useUlipPolicies,
} from '@/hooks/useAssets';
import { useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import {
  calculateAccountBalances,
  calculateNetWorth,
  groupInvestmentsBySymbol,
  summarizeHoldings,
} from '@repo/shared/logic';

/** Composes existing account/asset/investment queries into a net worth snapshot for the dashboard hero. */
export function useNetWorth() {
  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useAccounts();
  const { data: transactions, isLoading: txnsLoading, error: txnsError } = useAllTimeTransactions();
  const { data: fds, isLoading: fdsLoading } = useFixedDeposits();
  const { data: gold, isLoading: goldLoading } = useGoldAssets();
  const { data: liabilities, isLoading: liabilitiesLoading } = useLoanLiabilities();
  const { data: investments, isLoading: investmentsLoading } = useAllInvestmentLog();
  const { data: epfAccounts, isLoading: epfLoading } = useEpfAccounts();
  const { data: npsAccounts, isLoading: npsLoading } = useNpsAccounts();
  const { data: ssyAccounts, isLoading: ssyLoading } = useSsyAccounts();
  const { data: sgbHoldings, isLoading: sgbLoading } = useSgbHoldings();
  const { data: ulipPolicies, isLoading: ulipLoading } = useUlipPolicies();

  const isLoading =
    accountsLoading ||
    txnsLoading ||
    fdsLoading ||
    goldLoading ||
    liabilitiesLoading ||
    investmentsLoading ||
    epfLoading ||
    npsLoading ||
    ssyLoading ||
    sgbLoading ||
    ulipLoading;
  const error = accountsError || txnsError;

  const data = useMemo(() => {
    if (!accounts || !transactions) return null;
    const accountBalances = calculateAccountBalances(accounts, transactions);
    const holdings = investments ? groupInvestmentsBySymbol(investments) : [];
    return calculateNetWorth({
      accountBalances: accountBalances.map((b) => b.balance),
      activeFixedDeposits: (fds ?? []).filter((fd) => !fd.withdrawn),
      goldHoldings: gold ?? [],
      epfAccounts: epfAccounts ?? [],
      npsAccounts: npsAccounts ?? [],
      ssyAccounts: ssyAccounts ?? [],
      sgbHoldings: sgbHoldings ?? [],
      ulipPolicies: ulipPolicies ?? [],
      portfolioCurrentValue: summarizeHoldings(holdings).currentValue,
      liabilities: liabilities ?? [],
    });
  }, [accounts, transactions, fds, gold, liabilities, investments, epfAccounts, npsAccounts, ssyAccounts, sgbHoldings, ulipPolicies]);

  return { data, isLoading, error };
}
