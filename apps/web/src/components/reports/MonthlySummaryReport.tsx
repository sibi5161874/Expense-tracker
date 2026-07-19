'use client';

import { TrendingUp, TrendingDown, PiggyBank, Percent } from 'lucide-react';
import { useMonthlyOverview } from '@/hooks/useTransactions';
import { formatINR } from '@repo/shared/utils/currency';
import { formatMonth } from '@repo/shared/utils';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { StatCard } from '@/components/shared/StatCard';
import { CashFlowChart } from '@/components/shared/CashFlowChart';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';

export function MonthlySummaryReport() {
  const currentMonth = formatMonth(new Date());
  const { income, expense, netSavings, savingsRate, isLoading, error } = useMonthlyOverview(currentMonth);

  if (isLoading) return <LoadingState label="Loading report..." />;
  if (error) return <ErrorState error={error} />;

  const chartData = [{ label: currentMonth, income, expense }];

  return (
    <ReportContainer
      title="Monthly Summary"
      description={`Income, expense, and savings for ${currentMonth}.`}
      excelSheets={[
        {
          name: 'Monthly Summary',
          rows: [
            { Metric: 'Income', Value: income },
            { Metric: 'Expense', Value: expense },
            { Metric: 'Net Savings', Value: netSavings },
            { Metric: 'Savings Rate (%)', Value: Number(savingsRate.toFixed(2)) },
          ],
        },
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Income" value={formatINR(income)} icon={TrendingUp} tone="success" />
        <StatCard label="Expense" value={formatINR(expense)} icon={TrendingDown} tone="destructive" />
        <StatCard
          label="Net Savings"
          value={formatINR(netSavings)}
          icon={PiggyBank}
          tone={netSavings >= 0 ? 'success' : 'destructive'}
        />
        <StatCard label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} icon={Percent} tone="info" />
      </div>

      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">Income vs Expense</h2>
        <CashFlowChart data={chartData} />
      </div>
    </ReportContainer>
  );
}
