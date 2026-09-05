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
  useRealEstate,
  usePpfAccounts,
  useRecurringDeposits,
  useNscCertificates,
  useVehicles,
} from '@/hooks/useAssets';
import { useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { useFxRates } from '@/hooks/useFxRates';
import {
  calculateAccountBalances,
  calculateNetWorth,
  convertAccountBalancesToBase,
  groupInvestmentsBySymbol,
  summarizeHoldings,
} from '@repo/shared/logic';

/** Mirrors apps/web/src/hooks/useNetWorth.ts. */
export function useNetWorth() {
  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useAccounts();
  const { rates: fxRates, isStale: fxRatesStale, fetchedAt: fxRatesFetchedAt } = useFxRates();
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
  const { data: realEstate, isLoading: realEstateLoading } = useRealEstate();
  const { data: ppfAccounts, isLoading: ppfLoading } = usePpfAccounts();
  const { data: recurringDeposits, isLoading: rdLoading } = useRecurringDeposits();
  const { data: nscCertificates, isLoading: nscLoading } = useNscCertificates();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();

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
    ulipLoading ||
    realEstateLoading ||
    ppfLoading ||
    rdLoading ||
    nscLoading ||
    vehiclesLoading;
  const error = accountsError || txnsError;

  const conversion = useMemo(() => {
    if (!accounts || !transactions) return null;
    const accountBalances = calculateAccountBalances(accounts, transactions);
    return convertAccountBalancesToBase(accountBalances, accounts, fxRates);
  }, [accounts, transactions, fxRates]);

  const data = useMemo(() => {
    if (!accounts || !transactions || !conversion) return null;
    const holdings = investments ? groupInvestmentsBySymbol(investments) : [];
    return calculateNetWorth({
      accountBalances: conversion.convertedBalances,
      activeFixedDeposits: (fds ?? []).filter((fd) => !fd.withdrawn),
      goldHoldings: gold ?? [],
      epfAccounts: epfAccounts ?? [],
      npsAccounts: npsAccounts ?? [],
      ssyAccounts: ssyAccounts ?? [],
      sgbHoldings: sgbHoldings ?? [],
      ulipPolicies: ulipPolicies ?? [],
      realEstate: realEstate ?? [],
      ppfAccounts: ppfAccounts ?? [],
      recurringDeposits: recurringDeposits ?? [],
      nscCertificates: nscCertificates ?? [],
      vehicles: vehicles ?? [],
      portfolioCurrentValue: summarizeHoldings(holdings).currentValue,
      liabilities: liabilities ?? [],
    });
  }, [
    accounts,
    transactions,
    conversion,
    fds,
    gold,
    liabilities,
    investments,
    epfAccounts,
    npsAccounts,
    ssyAccounts,
    sgbHoldings,
    ulipPolicies,
    realEstate,
    ppfAccounts,
    recurringDeposits,
    nscCertificates,
    vehicles,
  ]);

  return {
    data,
    isLoading,
    error,
    unconvertedCurrencies: conversion?.unconvertedCurrencies ?? [],
    fxRatesStale,
    fxRatesFetchedAt,
  };
}
