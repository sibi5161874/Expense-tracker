'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Percent, Wallet, LineChart } from 'lucide-react';
import { useMonthlyOverview } from '@/hooks/useTransactions';
import { useMonthlyTrend } from '@/hooks/useMonthlyTrend';
import { useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { useGoals } from '@/hooks/useGoals';
import { useCashbook } from '@/hooks/useCashbook';
import { formatINR } from '@repo/shared/utils/currency';
import { formatMonth } from '@repo/shared/utils';
import { groupInvestmentsBySymbol, summarizeHoldings } from '@repo/shared/logic';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { CashFlowChart } from '@/components/shared/CashFlowChart';
import { ExpenseBreakdownChart } from '@/components/shared/ExpenseBreakdownChart';
import { GoalsProgressCard } from '@/components/dashboard/GoalsProgressCard';
import { QuickStatsCard } from '@/components/dashboard/QuickStatsCard';

export default function DashboardPage() {
  const currentMonth = formatMonth(new Date());
  const {
    income: monthlyIncome,
    expense: monthlyExpense,
    netSavings,
    savingsRate,
    categoryBreakdown,
  } = useMonthlyOverview(currentMonth);
  const { data: trend } = useMonthlyTrend(6);
  const { data: investments } = useAllInvestmentLog();
  const { data: goals } = useGoals();
  const { summary: cashbookSummary } = useCashbook();

  const holdings = useMemo(() => (investments ? groupInvestmentsBySymbol(investments) : []), [investments]);
  const portfolioSummary = investments ? summarizeHoldings(holdings) : null;
  const holdingsCount = holdings.length;
  const totalGoals = goals?.length ?? 0;
  const achievedGoals = goals?.filter((g) => g.saved_amount >= g.target_amount).length ?? 0;
  const totalCounterparties = cashbookSummary ? Object.keys(cashbookSummary).length : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Here's what's happening with your finances this month." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Income This Month" value={formatINR(monthlyIncome)} icon={TrendingUp} tone="success" />
        <StatCard label="Expense This Month" value={formatINR(monthlyExpense)} icon={TrendingDown} tone="destructive" />
        <StatCard
          label="Net Savings"
          value={formatINR(netSavings)}
          icon={PiggyBank}
          tone={netSavings >= 0 ? 'success' : 'destructive'}
        />
        <StatCard label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} icon={Percent} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Cash flow — last 6 months</h2>
          <CashFlowChart data={trend} />
        </div>
        <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Expenses by category — this month</h2>
          <ExpenseBreakdownChart data={categoryBreakdown} />
        </div>
      </div>

      {portfolioSummary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Invested" value={formatINR(portfolioSummary.totalInvested)} icon={Wallet} />
          <StatCard label="Portfolio Value" value={formatINR(portfolioSummary.currentValue)} icon={LineChart} tone="info" />
          <StatCard
            label="Portfolio P&L"
            value={formatINR(portfolioSummary.totalPnl)}
            icon={TrendingUp}
            tone={portfolioSummary.totalPnl >= 0 ? 'success' : 'destructive'}
          />
          <StatCard
            label="P&L %"
            value={`${portfolioSummary.pnlPercentage.toFixed(2)}%`}
            icon={Percent}
            tone={portfolioSummary.pnlPercentage >= 0 ? 'success' : 'destructive'}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <GoalsProgressCard goals={goals ?? []} />
        <QuickStatsCard
          stats={[
            { label: 'Total Goals', value: totalGoals },
            { label: 'Achieved Goals', value: achievedGoals },
            { label: 'Holdings', value: holdingsCount },
            { label: 'Cashbook Counterparties', value: totalCounterparties },
          ]}
        />
      </div>
    </div>
  );
}
