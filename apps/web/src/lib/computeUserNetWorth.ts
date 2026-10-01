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
import { getNetWorthRawData } from '@repo/shared/queries/netWorth';

/**
 * Server-side counterpart to NetWorthReport.tsx's client-side aggregation — same asset
 * tables, same calculateNetWorth, run with an admin (service_role) client for one user_id at
 * a time instead of the caller's own session. Used by the monthly email cron, which has no
 * user session to scope a client-side query to.
 *
 * Previously 17 separate Supabase round trips via Promise.all; now one
 * get_net_worth_raw_data RPC call (RULES.md §14 pattern) bundles all of them — every
 * calculation below is unchanged, only where the raw rows come from changed. See
 * supabase/migrations/20261001000002_net_worth_raw_data_rpc.sql.
 *
 * fxRates is fetched once per cron run and passed in, not re-fetched per user — it's the
 * same external rate regardless of whose net worth is being computed.
 */
export async function computeUserNetWorth(
  admin: SupabaseClient<Database>,
  userId: string,
  fxRates: FxRates
): Promise<NetWorthBreakdown & { unconvertedCurrencies: string[] }> {
  const raw = await getNetWorthRawData(admin, userId);

  const accounts = raw.accounts ?? [];
  const accountBalances = calculateAccountBalances(accounts, raw.transactions ?? []);
  const conversion = convertAccountBalancesToBase(accountBalances, accounts, fxRates);

  const livePriceOverrides = Object.fromEntries((raw.holdings ?? []).map((h) => [h.symbol, h.live_price]));
  const holdings = groupInvestmentsBySymbol(raw.investments ?? [], livePriceOverrides);

  const breakdown = calculateNetWorth({
    accountBalances: conversion.convertedBalances,
    activeFixedDeposits: (raw.fixed_deposits ?? []).filter((fd) => !fd.withdrawn),
    goldHoldings: raw.gold ?? [],
    epfAccounts: raw.epf ?? [],
    npsAccounts: raw.nps ?? [],
    ssyAccounts: raw.ssy ?? [],
    sgbHoldings: raw.sgb ?? [],
    ulipPolicies: raw.ulip ?? [],
    realEstate: raw.real_estate ?? [],
    ppfAccounts: raw.ppf ?? [],
    recurringDeposits: raw.recurring_deposits ?? [],
    nscCertificates: raw.nsc ?? [],
    vehicles: raw.vehicles ?? [],
    portfolioCurrentValue: summarizeHoldings(holdings).currentValue,
    liabilities: raw.liabilities ?? [],
  });

  return { ...breakdown, unconvertedCurrencies: conversion.unconvertedCurrencies };
}
