'use client';

import { useMemo } from 'react';
import { Wallet, LineChart, TrendingUp, Percent } from 'lucide-react';
import { useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { formatINR } from '@repo/shared/utils/currency';
import { groupInvestmentsBySymbol, summarizeHoldings } from '@repo/shared/logic';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { StatCard } from '@/components/shared/StatCard';
import { HoldingsTable } from '@/components/investments/HoldingsTable';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';

export function PortfolioSummaryReport() {
  const { data: investments, isLoading, error } = useAllInvestmentLog();

  const holdings = useMemo(() => (investments ? groupInvestmentsBySymbol(investments) : []), [investments]);
  const summary = useMemo(() => summarizeHoldings(holdings), [holdings]);

  if (isLoading) return <LoadingState label="Loading report..." />;
  if (error) return <ErrorState error={error} />;

  return (
    <ReportContainer
      title="Portfolio Summary"
      description="Current value, invested amount, and P&L per holding."
      excelSheets={[
        {
          name: 'Portfolio Summary',
          rows: holdings.map((h) => ({
            Symbol: h.symbol,
            Exchange: h.exchange,
            Units: h.unitsHeld,
            'Avg Cost': h.avgBuyPrice,
            'Current Price': h.currentPrice,
            Invested: h.invested,
            'Current Value': h.currentValue,
            'P&L': h.unrealisedPnl,
            'Return %': Number((h.returnPct * 100).toFixed(2)),
          })),
        },
      ]}
    >
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

      <HoldingsTable holdings={holdings} />
    </ReportContainer>
  );
}
