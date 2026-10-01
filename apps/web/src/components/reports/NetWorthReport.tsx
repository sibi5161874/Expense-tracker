'use client';

import { useMemo, useRef } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useNetWorthRawData } from '@/hooks/useNetWorthRawData';
import { useFxRates } from '@/hooks/useFxRates';
import {
  calculateAccountBalances,
  calculateNetWorth,
  convertAccountBalancesToBase,
  groupInvestmentsBySymbol,
  summarizeHoldings,
} from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { ErrorState } from '@/components/shared/QueryState';
import { ReportSkeleton } from '@/components/shared/ReportSkeleton';
import { NetWorthSnapshotHistory } from '@/components/reports/NetWorthSnapshotHistory';

interface NetWorthRow {
  label: string;
  value: number;
  isTotal?: boolean;
}

export function NetWorthReport() {
  const chartRef = useRef<HTMLDivElement>(null);
  const { data: raw, isLoading, error } = useNetWorthRawData();
  const { rates: fxRates, isStale: fxRatesStale, fetchedAt: fxRatesFetchedAt } = useFxRates();

  const conversion = useMemo(() => {
    if (!raw) return null;
    const accountBalances = calculateAccountBalances(raw.accounts, raw.transactions);
    return convertAccountBalancesToBase(accountBalances, raw.accounts, fxRates);
  }, [raw, fxRates]);

  const breakdown = useMemo(() => {
    if (!raw || !conversion) return null;
    const holdings = groupInvestmentsBySymbol(raw.investments);
    return calculateNetWorth({
      accountBalances: conversion.convertedBalances,
      activeFixedDeposits: raw.fixed_deposits.filter((fd) => !fd.withdrawn),
      goldHoldings: raw.gold,
      epfAccounts: raw.epf,
      npsAccounts: raw.nps,
      ssyAccounts: raw.ssy,
      sgbHoldings: raw.sgb,
      ulipPolicies: raw.ulip,
      realEstate: raw.real_estate,
      ppfAccounts: raw.ppf,
      recurringDeposits: raw.recurring_deposits,
      nscCertificates: raw.nsc,
      vehicles: raw.vehicles,
      portfolioCurrentValue: summarizeHoldings(holdings).currentValue,
      liabilities: raw.liabilities,
    });
  }, [raw, conversion]);

  if (isLoading) return <ReportSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!breakdown) return null;

  const chartData = [
    { label: 'Cash & Bank', value: breakdown.cashAndBankTotal },
    { label: 'Fixed Deposits', value: breakdown.fixedDepositsTotal },
    { label: 'Gold', value: breakdown.goldTotal },
    { label: 'EPF', value: breakdown.epfTotal },
    { label: 'NPS', value: breakdown.npsTotal },
    { label: 'SSY', value: breakdown.ssyTotal },
    { label: 'SGB', value: breakdown.sgbTotal },
    { label: 'ULIP', value: breakdown.ulipTotal },
    { label: 'Real Estate', value: breakdown.realEstateTotal },
    { label: 'PPF', value: breakdown.ppfTotal },
    { label: 'Recurring Deposits', value: breakdown.recurringDepositsTotal },
    { label: 'NSC', value: breakdown.nscTotal },
    { label: 'Vehicles', value: breakdown.vehiclesTotal },
    { label: 'Portfolio', value: breakdown.portfolioValue },
    { label: 'Liabilities', value: -breakdown.liabilitiesTotal },
  ];

  const tableRows: NetWorthRow[] = [...chartData, { label: 'Net Worth', value: breakdown.netWorth, isTotal: true }];

  const columns: DataTableColumn<NetWorthRow>[] = [
    { id: 'item', header: 'Item', cell: (r) => <span className={r.isTotal ? 'font-semibold' : 'font-medium'}>{r.label}</span> },
    {
      id: 'amount',
      header: 'Amount',
      className: 'text-right',
      cell: (r) => <span className={r.isTotal ? 'font-semibold' : undefined}>{formatINR(r.value)}</span>,
      sortValue: (r) => r.value,
    },
  ];

  return (
    <ReportContainer
      title="Net Worth Statement"
      description="Current breakdown of assets, portfolio, and liabilities, plus net worth growth over time from saved snapshots."
      excelSheets={[
        {
          name: 'Net Worth',
          rows: [
            ...chartData.map((d) => ({ Item: d.label, Amount: d.value })),
            { Item: 'Net Worth', Amount: breakdown.netWorth },
          ],
        },
      ]}
      chartRef={chartRef}
    >
      {conversion && conversion.unconvertedCurrencies.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
          ⚠ Couldn&apos;t fetch a live rate for {conversion.unconvertedCurrencies.join(', ')} — accounts in{' '}
          {conversion.unconvertedCurrencies.length === 1 ? 'that currency are' : 'those currencies are'} excluded
          from the totals below until rates are available.
        </div>
      )}

      {fxRatesStale && fxRatesFetchedAt && (
        <div className="text-muted-foreground text-xs">
          Exchange rates as of{' '}
          {new Date(fxRatesFetchedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}{' '}
          — the live rate provider is unreachable, so foreign-currency conversions below use the last successful fetch.
        </div>
      )}

      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <p className="text-muted-foreground text-sm">Net Worth</p>
        <p className={`text-3xl font-semibold tabular-nums ${breakdown.netWorth >= 0 ? 'text-success' : 'text-destructive'}`}>
          {formatINR(breakdown.netWorth)}
        </p>
      </div>

      <div ref={chartRef} className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">Breakdown</h2>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 16 }}>
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
            <YAxis type="category" dataKey="label" width={100} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: 'var(--muted)' }}
              contentStyle={{
                background: 'var(--popover)',
                color: 'var(--popover-foreground)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: 12,
              }}
              formatter={(value) => formatINR(Number(value))}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((d) => (
                <Cell key={d.label} fill={d.value >= 0 ? 'var(--success)' : 'var(--destructive)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <DataTable data={tableRows} columns={columns} getRowId={(r) => r.label} />

      <NetWorthSnapshotHistory currentBreakdown={breakdown} />
    </ReportContainer>
  );
}
