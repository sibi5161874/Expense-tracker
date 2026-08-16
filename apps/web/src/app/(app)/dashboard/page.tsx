'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, PiggyBank, Percent, Wallet, LineChart, FileStack } from 'lucide-react';
import { useMonthlyOverview } from '@/hooks/useTransactions';
import { useMonthlyTrend } from '@/hooks/useMonthlyTrend';
import { useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { useHoldings } from '@/hooks/useHoldings';
import { useGoals } from '@/hooks/useGoals';
import { useCashbook } from '@/hooks/useCashbook';
import { useNetWorth } from '@/hooks/useNetWorth';
import { formatMonth } from '@repo/shared/utils';
import { groupInvestmentsBySymbol, summarizeHoldings } from '@repo/shared/logic';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CashFlowChart } from '@/components/shared/CashFlowChart';
import { ExpenseBreakdownChart } from '@/components/shared/ExpenseBreakdownChart';
import { GoalsProgressCard } from '@/components/dashboard/GoalsProgressCard';
import { QuickStatsCard } from '@/components/dashboard/QuickStatsCard';
import { NetWorthHero } from '@/components/dashboard/NetWorthHero';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { BudgetHealthCard } from '@/components/dashboard/BudgetHealthCard';
import { FinancialEssentialsCard } from '@/components/dashboard/FinancialEssentialsCard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { ErrorState } from '@/components/shared/QueryState';

export default function DashboardPage() {
  const currentMonth = formatMonth(new Date());
  const {
    income: monthlyIncome,
    expense: monthlyExpense,
    netSavings,
    savingsRate,
    categoryBreakdown,
    isLoading: overviewLoading,
    error: overviewError,
  } = useMonthlyOverview(currentMonth);
  const { data: trend, isLoading: trendLoading } = useMonthlyTrend(6);
  const { data: investments } = useAllInvestmentLog();
  const { data: holdingRows } = useHoldings();
  const { data: goals } = useGoals();
  const { summary: cashbookSummary } = useCashbook();
  const { data: netWorth, isLoading: netWorthLoading, error: netWorthError } = useNetWorth();

  const livePriceOverrides = useMemo(
    () => Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price])),
    [holdingRows]
  );
  const holdings = useMemo(
    () => (investments ? groupInvestmentsBySymbol(investments, livePriceOverrides) : []),
    [investments, livePriceOverrides]
  );
  const portfolioSummary = investments ? summarizeHoldings(holdings) : null;
  const holdingsCount = holdings.length;
  const totalGoals = goals?.length ?? 0;
  const achievedGoals = goals?.filter((g) => g.saved_amount >= g.target_amount).length ?? 0;
  const totalCounterparties = cashbookSummary ? Object.keys(cashbookSummary).length : 0;

  const isLoading = overviewLoading || trendLoading || netWorthLoading;
  const error = overviewError || netWorthError;

  const hasActivity =
    (trend ?? []).some((t) => t.income > 0 || t.expense > 0) ||
    holdingsCount > 0 ||
    totalGoals > 0 ||
    totalCounterparties > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Here's what's happening with your finances this month."
        action={
          // nativeButton={false} because this renders an <a> via Link, not a <button>.
          <Button variant="outline" nativeButton={false} render={<Link href="/reports/overall" />}>
            <FileStack className="size-4" />
            View Overall Report
          </Button>
        }
      />

      {isLoading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorState error={error} />
      ) : !hasActivity ? (
        <DashboardEmptyState />
      ) : (
        <>
          {netWorth && <NetWorthHero breakdown={netWorth} />}

          <KpiStrip
            items={[
              { label: 'Income This Month', value: monthlyIncome, icon: TrendingUp, tone: 'success' },
              { label: 'Expense This Month', value: monthlyExpense, icon: TrendingDown, tone: 'destructive' },
              {
                label: 'Net Savings',
                value: netSavings,
                icon: PiggyBank,
                tone: netSavings >= 0 ? 'success' : 'destructive',
              },
              { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, icon: Percent, tone: 'info' },
            ]}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent>
                <h2 className="mb-4 text-sm font-semibold">Cash flow — last 6 months</h2>
                <CashFlowChart data={trend ?? []} />
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h2 className="mb-4 text-sm font-semibold">Expenses by category — this month</h2>
                <ExpenseBreakdownChart data={categoryBreakdown} />
              </CardContent>
            </Card>
          </div>

          {portfolioSummary && (
            <KpiStrip
              items={[
                { label: 'Total Invested', value: portfolioSummary.totalInvested, icon: Wallet },
                { label: 'Portfolio Value', value: portfolioSummary.currentValue, icon: LineChart, tone: 'info' },
                {
                  label: 'Portfolio P&L',
                  value: portfolioSummary.totalPnl,
                  icon: TrendingUp,
                  tone: portfolioSummary.totalPnl >= 0 ? 'success' : 'destructive',
                },
                {
                  label: 'P&L %',
                  value: `${portfolioSummary.pnlPercentage.toFixed(2)}%`,
                  icon: Percent,
                  tone: portfolioSummary.pnlPercentage >= 0 ? 'success' : 'destructive',
                },
              ]}
            />
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <BudgetHealthCard />
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

          <FinancialEssentialsCard />
        </>
      )}
    </div>
  );
}
