'use client';

import { useMemo } from 'react';
import { Wallet, LineChart, TrendingUp, Percent } from 'lucide-react';
import { useInvestmentLog, useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { formatINR } from '@repo/shared/utils/currency';
import { groupInvestmentsBySymbol, summarizeHoldings } from '@repo/shared/logic';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { ExpenseBreakdownChart } from '@/components/shared/ExpenseBreakdownChart';
import { HoldingsTable } from '@/components/investments/HoldingsTable';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import { AmountText } from '@/components/shared/AmountText';

export default function PortfolioPage() {
  const { data: allInvestments, isLoading, error } = useAllInvestmentLog();
  const { data: recentInvestments } = useInvestmentLog({ page: 0 });

  const holdings = useMemo(
    () => (allInvestments ? groupInvestmentsBySymbol(allInvestments) : []),
    [allInvestments]
  );
  const allocation = useMemo(() => holdings.map((h) => ({ name: h.symbol, value: h.currentValue })), [holdings]);

  if (isLoading) return <LoadingState label="Loading portfolio..." />;
  if (error) return <ErrorState error={error} />;

  const summary = allInvestments ? summarizeHoldings(holdings) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Portfolio" description="Holdings computed from your investment log." />

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Invested" value={formatINR(summary.totalInvested)} icon={Wallet} />
          <StatCard label="Current Value" value={formatINR(summary.currentValue)} icon={LineChart} tone="info" />
          <StatCard
            label="Total P&L"
            value={formatINR(summary.totalPnl)}
            icon={TrendingUp}
            tone={summary.totalPnl >= 0 ? 'success' : 'destructive'}
          />
          <StatCard
            label="P&L %"
            value={`${summary.pnlPercentage.toFixed(2)}%`}
            icon={Percent}
            tone={summary.pnlPercentage >= 0 ? 'success' : 'destructive'}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Holdings</h2>
          <HoldingsTable holdings={holdings} />
        </div>
        <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Allocation by symbol</h2>
          <ExpenseBreakdownChart data={allocation} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Recent transactions</h2>
        <div className="bg-card border-border/60 divide-border/60 divide-y overflow-hidden rounded-2xl border shadow-sm">
          {recentInvestments?.slice(0, 10).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-muted-foreground w-20 shrink-0">{inv.date}</span>
                <span className="font-medium">{inv.symbol}</span>
                <span className="text-muted-foreground">{inv.action}</span>
              </div>
              <AmountText value={inv.quantity * inv.price} colorBySign={false} />
            </div>
          ))}
          {(!recentInvestments || recentInvestments.length === 0) && (
            <p className="text-muted-foreground p-8 text-center text-sm">No transactions found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
