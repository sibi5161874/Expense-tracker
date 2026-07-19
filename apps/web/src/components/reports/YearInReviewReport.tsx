'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Tag } from 'lucide-react';
import { useTransactionsInRange, yearRange } from '@/hooks/useReportsData';
import { formatINR } from '@repo/shared/utils/currency';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { StatCard } from '@/components/shared/StatCard';
import { CashFlowChart } from '@/components/shared/CashFlowChart';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function YearInReviewReport() {
  const year = new Date().getFullYear();
  const { from, to } = yearRange(year);
  const { data: transactions, isLoading, error } = useTransactionsInRange(from, to);

  const { chartData, totals, biggestMonth, topCategory } = useMemo(() => {
    const monthly = MONTH_LABELS.map((label, i) => ({
      label,
      monthIndex: i,
      income: 0,
      expense: 0,
    }));
    const categoryTotals = new Map<string, number>();
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions ?? []) {
      const monthIndex = Number(t.date.slice(5, 7)) - 1;
      const bucket = monthly[monthIndex];
      if (!bucket) continue;
      if (t.type === 'Income') {
        bucket.income += t.amount;
        totalIncome += t.amount;
      } else if (t.type === 'Expense') {
        bucket.expense += t.amount;
        totalExpense += t.amount;
        const name = t.category?.name ?? 'Uncategorized';
        categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + t.amount);
      }
    }

    const biggestMonth = [...monthly].sort((a, b) => b.expense - a.expense)[0];
    const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      chartData: monthly,
      totals: { income: totalIncome, expense: totalExpense, net: totalIncome - totalExpense },
      biggestMonth,
      topCategory,
    };
  }, [transactions]);

  if (isLoading) return <LoadingState label="Loading report..." />;
  if (error) return <ErrorState error={error} />;

  return (
    <ReportContainer
      title="Year in Review"
      description={`${year} totals, biggest month, and top category.`}
      excelSheets={[
        { name: 'Monthly Totals', rows: chartData.map((m) => ({ Month: m.label, Income: m.income, Expense: m.expense })) },
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Income" value={formatINR(totals.income)} icon={TrendingUp} tone="success" />
        <StatCard label="Total Expense" value={formatINR(totals.expense)} icon={TrendingDown} tone="destructive" />
        <StatCard
          label="Biggest Month"
          value={biggestMonth && biggestMonth.expense > 0 ? biggestMonth.label : '-'}
          icon={Calendar}
          tone="info"
        />
        <StatCard label="Top Category" value={topCategory?.[0] ?? '-'} icon={Tag} tone="warning" />
      </div>

      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">Monthly Totals — {year}</h2>
        <CashFlowChart data={chartData} />
      </div>
    </ReportContainer>
  );
}
