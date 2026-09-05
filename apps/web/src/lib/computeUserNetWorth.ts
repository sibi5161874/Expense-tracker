import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/shared/types';
import {
  calculateAccountBalances,
  calculateNetWorth,
  convertAccountBalancesToBase,
  groupInvestmentsBySymbol,
  summarizeHoldings,
  type NetWorthBreakdown,
  type FxRates,
} from '@repo/shared/logic';
import { getAccounts } from '@repo/shared/queries/config';
import { getAllTransactionsForReports } from '@repo/shared/queries/transactions';
import { getAllInvestmentLog } from '@repo/shared/queries/investmentLog';
import { getHoldings } from '@repo/shared/queries/holdings';
import {
  getFixedDeposits,
  getGold,
  getLoansLiabilities,
  getEpfAccounts,
  getNpsAccounts,
  getSsyAccounts,
  getSgbHoldings,
  getUlipPolicies,
  getRealEstate,
  getPpfAccounts,
  getRecurringDeposits,
  getNscCertificates,
  getVehicles,
} from '@repo/shared/queries/assets';

/**
 * Server-side counterpart to NetWorthReport.tsx's client-side aggregation — same 13 asset
 * tables, same calculateNetWorth, run with an admin (service_role) client for one user_id at
 * a time instead of the caller's own session. Used by the monthly email cron, which has no
 * user session to scope a client-side query to.
 *
 * fxRates is fetched once per cron run and passed in, not re-fetched per user — it's the
 * same external rate regardless of whose net worth is being computed.
 */
export async function computeUserNetWorth(
  admin: SupabaseClient<Database>,
  userId: string,
  fxRates: FxRates
): Promise<NetWorthBreakdown & { unconvertedCurrencies: string[] }> {
  const [
    accounts,
    transactions,
    investments,
    holdingRows,
    fds,
    gold,
    liabilities,
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
  ] = await Promise.all([
    getAccounts(admin, userId),
    getAllTransactionsForReports(admin, userId),
    getAllInvestmentLog(admin, userId),
    getHoldings(admin, userId),
    getFixedDeposits(admin, userId),
    getGold(admin, userId),
    getLoansLiabilities(admin, userId),
    getEpfAccounts(admin, userId),
    getNpsAccounts(admin, userId),
    getSsyAccounts(admin, userId),
    getSgbHoldings(admin, userId),
    getUlipPolicies(admin, userId),
    getRealEstate(admin, userId),
    getPpfAccounts(admin, userId),
    getRecurringDeposits(admin, userId),
    getNscCertificates(admin, userId),
    getVehicles(admin, userId),
  ]);

  const accountBalances = calculateAccountBalances(accounts ?? [], transactions ?? []);
  const conversion = convertAccountBalancesToBase(accountBalances, accounts ?? [], fxRates);

  const livePriceOverrides = Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price]));
  const holdings = groupInvestmentsBySymbol(investments ?? [], livePriceOverrides);

  const breakdown = calculateNetWorth({
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

  return { ...breakdown, unconvertedCurrencies: conversion.unconvertedCurrencies };
}
