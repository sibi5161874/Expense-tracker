'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Wallet, LineChart, TrendingUp, Percent, RefreshCw, AlertTriangle } from 'lucide-react';
import { useInvestmentLog, useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { useHoldings } from '@/hooks/useHoldings';
import { useRefreshPrices } from '@/hooks/useRefreshPrices';
import { useEntitlements } from '@/hooks/useEntitlements';
import { formatINR, formatRelativeTime } from '@repo/shared/utils';
import { groupInvestmentsBySymbol, summarizeHoldings } from '@repo/shared/logic';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { ProLockedButton } from '@/components/shared/ProGate';
import { ExpenseBreakdownChart } from '@/components/shared/ExpenseBreakdownChart';
import { HoldingsTable } from '@/components/investments/HoldingsTable';
import { TaxLossHarvestingCard } from '@/components/investments/TaxLossHarvestingCard';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import { AmountText } from '@/components/shared/AmountText';
import { cn } from '@/lib/utils';

export default function PortfolioPage() {
  const router = useRouter();
  const { data: allInvestments, isLoading, error } = useAllInvestmentLog();
  const { data: recentInvestments } = useInvestmentLog({ page: 0 });
  const { data: holdingRows } = useHoldings();
  const { refresh, isRefreshing } = useRefreshPrices();
  const { hasFeature } = useEntitlements();

  function goToUpgrade() {
    toast.info('Live price refresh is a Pro feature — start your free trial to unlock it.');
    router.push('/settings?tab=billing');
  }

  const livePriceOverrides = useMemo(
    () => Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price])),
    [holdingRows]
  );
  const lastUpdated = useMemo(() => {
    if (!holdingRows || holdingRows.length === 0) return null;
    const mostRecent = holdingRows.reduce((latest, h) => (h.updated_at > latest ? h.updated_at : latest), holdingRows[0]!.updated_at);
    return mostRecent;
  }, [holdingRows]);
  // Prices come from AMFI (mutual fund NAVs — official) and Yahoo Finance
  // (Stock/ETF — unofficial and undocumented), via /api/prices/refresh. Neither
  // has a fallback source, so if one silently breaks `lastUpdated` just stops
  // advancing. Surfacing staleness here is the signal users get.
  //
  // Date.now() makes this impure, which is why it isn't wrapped in useMemo (that implies a
  // cacheable pure computation). This is a one-off freshness check, not a ticking clock — it
  // only needs to be right as of whenever the page next re-renders for an unrelated reason
  // (e.g. holdings data changing), not to update itself every second, so a timer-driven
  // effect would be solving a problem this component doesn't have.
  // eslint-disable-next-line react-hooks/purity -- see comment above
  const isStale = lastUpdated ? Date.now() - new Date(lastUpdated).getTime() > 24 * 60 * 60 * 1000 : false;

  const holdings = useMemo(
    () => (allInvestments ? groupInvestmentsBySymbol(allInvestments, livePriceOverrides) : []),
    [allInvestments, livePriceOverrides]
  );
  const allocation = useMemo(() => holdings.map((h) => ({ name: h.symbol, value: h.currentValue })), [holdings]);

  // Stagger-fade holdings rows in only on the very first successful load, never on refetch.
  // A ref can't be read during render (see react-hooks/refs), so this tracks the same
  // "have we animated yet" flag as state instead, flipped via the same render-time
  // "adjusting state" pattern used for the tab-from-URL pages elsewhere in this app: this
  // render's `shouldAnimateRows` is computed first and used as-is for the current output,
  // then setHasAnimated schedules the flag for next render — never itself re-read this render.
  const [hasAnimated, setHasAnimated] = useState(false);
  const shouldAnimateRows = !isLoading && !hasAnimated;
  if (shouldAnimateRows) {
    setHasAnimated(true);
  }

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
              <span
                className={cn(
                  'flex items-center gap-1 text-xs',
                  isStale ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground'
                )}
              >
                {isStale && <AlertTriangle className="size-3.5" />}
                {isStale ? 'Prices may be stale — ' : 'Last updated '}
                {formatRelativeTime(lastUpdated)}
              </span>
            )}
            {hasFeature('livePriceRefresh') ? (
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
              </Button>
            ) : (
              <ProLockedButton
                label="Refresh Prices"
                icon={<RefreshCw className="size-3.5" />}
                onUpgradeClick={goToUpgrade}
              />
            )}
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
        <div className="bg-card rounded-2xl p-5">
          <h2 className="mb-4 text-sm font-semibold">Allocation by symbol</h2>
          <ExpenseBreakdownChart data={allocation} />
        </div>
      </div>

      <TaxLossHarvestingCard holdings={holdings} />

      <div>
        <h2 className="mb-3 text-sm font-semibold">Recent transactions</h2>
        <div className="bg-card overflow-hidden rounded-2xl">
          {recentInvestments?.slice(0, 10).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-4 text-sm">
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
