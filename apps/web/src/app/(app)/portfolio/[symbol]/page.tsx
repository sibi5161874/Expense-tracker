'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Hash, Wallet, LineChart, TrendingUp } from 'lucide-react';
import { useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { useHoldings } from '@/hooks/useHoldings';
import { useEntitlements } from '@/hooks/useEntitlements';
import { groupInvestmentsBySymbol } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { ProBlurredPreview } from '@/components/shared/ProGate';
import { FundamentalCard } from '@/components/investments/FundamentalCard';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';

export default function StockDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = decodeURIComponent(params.symbol).toUpperCase();
  const router = useRouter();
  const { hasFeature } = useEntitlements();

  const { data: allInvestments, isLoading, error } = useAllInvestmentLog();
  const { data: holdingRows } = useHoldings();

  const livePriceOverrides = useMemo(
    () => Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price])),
    [holdingRows]
  );
  const holding = useMemo(() => {
    if (!allInvestments) return null;
    const holdings = groupInvestmentsBySymbol(allInvestments, livePriceOverrides);
    return holdings.find((h) => h.symbol.toUpperCase() === symbol) ?? null;
  }, [allInvestments, livePriceOverrides, symbol]);

  function goToUpgrade() {
    toast.info('Stock fundamentals are a Pro feature — start your free trial to unlock it.');
    router.push('/settings?tab=billing');
  }

  if (isLoading) return <LoadingState label="Loading holding..." />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={symbol}
        description={holding ? holding.exchange : 'Holding not found'}
        action={
          <button
            onClick={() => router.push('/portfolio')}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" />
            Back to Portfolio
          </button>
        }
      />

      {!holding ? (
        <p className="text-muted-foreground text-sm">
          No open position in {symbol}. It may have been fully sold, or the symbol doesn&apos;t match anything in your investment log.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Quantity" value={String(holding.unitsHeld)} icon={Hash} />
            <StatCard label="Avg Cost" value={formatINR(holding.avgBuyPrice)} icon={Wallet} />
            <StatCard label="Current Price" value={formatINR(holding.currentPrice)} icon={LineChart} tone="info" />
            <StatCard
              label="P&L"
              value={formatINR(holding.unrealisedPnl)}
              icon={TrendingUp}
              tone={holding.unrealisedPnl >= 0 ? 'success' : 'destructive'}
            />
          </div>

          <ProBlurredPreview
            feature="livePriceRefresh"
            title="Stock Fundamentals"
            description="P/E ratio, 52-week range, margins, market cap, and more — start your free trial to unlock it."
            onUpgradeClick={goToUpgrade}
          >
            {hasFeature('livePriceRefresh') ? (
              <FundamentalCard ticker={symbol} exchange={holding.exchange} />
            ) : (
              <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold">Fundamentals</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {['Trailing P/E', 'Forward P/E', '52W High', '52W Low', 'Profit Margin', 'Market Cap', 'Beta', 'Dividend Yield'].map(
                    (label) => (
                      <div key={label}>
                        <p className="text-muted-foreground text-xs">{label}</p>
                        <p className="font-mono text-sm font-semibold">--</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </ProBlurredPreview>
        </>
      )}
    </div>
  );
}
