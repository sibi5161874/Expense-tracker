'use client';

import { useMemo } from 'react';
import { useTransactionsInRange, monthsAgo } from '@/hooks/useReportsData';
import { formatMonth } from '@repo/shared/utils';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { StackedAreaChart } from '@/components/shared/StackedAreaChart';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';

const MONTHS_BACK = 6;
const TOP_N_CATEGORIES = 5;

export function SpendingTrendReport() {
  const from = monthsAgo(MONTHS_BACK - 1);
  const to = formatMonth(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)) + '-01';
  const { data: transactions, isLoading, error } = useTransactionsInRange(from, to);

  const { chartData, topCategories } = useMemo(() => {
    const expenses = (transactions ?? []).filter((t) => t.type === 'Expense');

    const totalsByCategory = new Map<string, number>();
    for (const t of expenses) {
      const name = t.category?.name ?? 'Uncategorized';
      totalsByCategory.set(name, (totalsByCategory.get(name) ?? 0) + t.amount);
    }
    const topCategories = Array.from(totalsByCategory, ([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, TOP_N_CATEGORIES)
      .map((c) => c.name);

    const months: string[] = [];
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const d = new Date();
      months.push(formatMonth(new Date(d.getFullYear(), d.getMonth() - i, 1)));
    }

    const chartData = months.map((month) => {
      const row: Record<string, string | number> = {
        label: new Date(`${month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short' }),
      };
      for (const category of topCategories) row[category] = 0;
      row.Other = 0;

      for (const t of expenses) {
        if (!t.date.startsWith(month)) continue;
        const name = t.category?.name ?? 'Uncategorized';
        const key = topCategories.includes(name) ? name : 'Other';
        row[key] = (Number(row[key]) || 0) + t.amount;
      }
      return row;
    });

    return { chartData, topCategories };
  }, [transactions]);

  if (isLoading) return <LoadingState label="Loading report..." />;
  if (error) return <ErrorState error={error} />;

  return (
    <ReportContainer
      title="Spending Trend"
      description={`Top ${TOP_N_CATEGORIES} expense categories over the last ${MONTHS_BACK} months.`}
      excelSheets={[{ name: 'Spending Trend', rows: chartData.map((r) => r as Record<string, string | number>) }]}
    >
      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">Spending Trend</h2>
        <StackedAreaChart data={chartData} xKey="label" series={[...topCategories, 'Other']} />
      </div>
    </ReportContainer>
  );
}
