'use client';

import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { Wallet, LineChart, TrendingUp, Percent, RefreshCw } from 'lucide-react';
import { useInvestmentLog, useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { useHoldings } from '@/hooks/useHoldings';
import { useRefreshPrices } from '@/hooks/useRefreshPrices';
import { formatINR, formatRelativeTime } from '@repo/shared/utils';
import { groupInvestmentsBySymbol, summarizeHoldings } from '@repo/shared/logic';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { ExpenseBreakdownChart } from '@/components/shared/ExpenseBreakdownChart';
import { HoldingsTable } from '@/components/investments/HoldingsTable';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import { AmountText } from '@/components/shared/AmountText';
import { cn } from '@/lib/utils';

export default function PortfolioPage() {
  const { data: allInvestments, isLoading, error } = useAllInvestmentLog();
  const { data: recentInvestments } = useInvestmentLog({ page: 0 });
  const { data: holdingRows } = useHoldings();
  const { refresh, isRefreshing } = useRefreshPrices();

  const livePriceOverrides = useMemo(
    () => Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price])),
    [holdingRows]
  );
  const lastUpdated = useMemo(() => {
    if (!holdingRows || holdingRows.length === 0) return null;
    const mostRecent = holdingRows.reduce((latest, h) => (h.updated_at > latest ? h.updated_at : latest), holdingRows[0]!.updated_at);
    return mostRecent;
  }, [holdingRows]);

  const holdings = useMemo(
    () => (allInvestments ? groupInvestmentsBySymbol(allInvestments, livePriceOverrides) : []),
    [allInvestments, livePriceOverrides]
  );
  const allocation = useMemo(() => holdings.map((h) => ({ name: h.symbol, value: h.currentValue })), [holdings]);

  // Stagger-fade holdings rows in only on the very first successful load, never on refetch.
  const hasAnimatedRef = useRef(false);
  const shouldAnimateRows = !isLoading && !hasAnimatedRef.current;
  useEffect(() => {
    if (!isLoading) hasAnimatedRef.current = true;
  }, [isLoading]);

  async function handleRefresh() {
    try {
      const result = await refresh();
      const firstFailureReason = result.failed[0] ? result.failedReasons?.[result.failed[0]] : undefined;

      if (result.updated.length > 0 && result.failed.length === 0) {
        toast.success(`Updated ${result.updated.length} price${result.updated.length === 1 ? '' : 's'}.`);
      } else if (result.updated.length > 0 && result.failed.length > 0) {
        toast.warning(`Updated ${result.updated.length}, failed for ${result.failed.join(', ')}.`, {
          description: firstFailureReason,
        });
      } else if (result.failed.length > 0) {
        toast.error(`Couldn't refresh any prices (${result.failed.join(', ')}).`, {
          description: firstFailureReason,
        });
      } else {
        toast.info(result.message ?? 'No Stock/ETF holdings to refresh.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to refresh prices.');
    }
  }

  if (isLoading) return <LoadingState label="Loading portfolio..." />;
  if (error) return <ErrorState error={error} />;

  const summary = allInvestments ? summarizeHoldings(holdings) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio"
        description="Holdings computed from your investment log."
        action={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-muted-foreground text-xs">Last updated {formatRelativeTime(lastUpdated)}</span>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
            </Button>
          </div>
        }
      />

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
          <HoldingsTable holdings={holdings} animateRows={shouldAnimateRows} />
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
