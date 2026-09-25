'use client';

import { useMemo } from 'react';
import { useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { useHoldings } from '@/hooks/useHoldings';
import { computePortfolioXirr, groupInvestmentsBySymbol, type HoldingXirrResult } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { ErrorState } from '@/components/shared/QueryState';
import { ReportSkeleton } from '@/components/shared/ReportSkeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Award, DollarSign } from 'lucide-react';

export function XirrReport() {
  const { data: investments, isLoading: isLogsLoading, error: logsError } = useAllInvestmentLog();
  const { data: holdingRows, isLoading: isHoldingsLoading, error: holdingsError } = useHoldings();

  const report = useMemo(() => {
    const livePriceOverrides = Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price]));
    const computedHoldings = investments ? groupInvestmentsBySymbol(investments, livePriceOverrides) : [];
    const holdingsData = computedHoldings.map((h) => ({
      symbol: h.symbol,
      shares: h.unitsHeld,
      current_price: h.currentPrice,
      current_value: h.currentValue,
    }));

    return computePortfolioXirr(investments ?? [], holdingsData);
  }, [investments, holdingRows]);

  const isLoading = isLogsLoading || isHoldingsLoading;
  const error = logsError || holdingsError;

  if (isLoading) return <ReportSkeleton />;
  if (error) return <ErrorState error={error as Error} />;

  const columns: DataTableColumn<HoldingXirrResult>[] = [
    {
      id: 'symbol',
      header: 'Holding',
      cell: (h) => (
        <div>
          <span className="font-semibold">{h.symbol}</span>
          {h.firstDate && <div className="text-muted-foreground text-xs">Since {h.firstDate}</div>}
        </div>
      ),
      sortValue: (h) => h.symbol,
    },
    {
      id: 'xirr',
      header: 'Annualized XIRR',
      className: 'text-right',
      cell: (h) => {
        if (h.xirrPct === null) return <span className="text-muted-foreground text-xs font-mono">—</span>;
        const isPositive = h.xirrPct >= 0;
        return (
          <Badge
            variant={isPositive ? 'default' : 'destructive'}
            className={isPositive ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-mono' : 'font-mono'}
          >
            {isPositive ? '+' : ''}{h.xirrPct.toFixed(2)}% p.a.
          </Badge>
        );
      },
      sortValue: (h) => h.xirrPct ?? -9999,
    },
    {
      id: 'invested',
      header: 'Total Invested',
      className: 'text-right',
      cell: (h) => formatINR(h.totalInvested),
      sortValue: (h) => h.totalInvested,
    },
    {
      id: 'currentValue',
      header: 'Current Value',
      className: 'text-right',
      cell: (h) => formatINR(h.currentValue),
      sortValue: (h) => h.currentValue,
    },
    {
      id: 'realized',
      header: 'Realized / Dividends',
      className: 'text-right',
      cell: (h) => (
        <div className="text-xs">
          <div>Sold: {formatINR(h.totalRealized)}</div>
          {h.totalDividends > 0 && <div className="text-emerald-600 dark:text-emerald-400">Div: {formatINR(h.totalDividends)}</div>}
        </div>
      ),
      sortValue: (h) => h.totalRealized + h.totalDividends,
    },
  ];

  return (
    <ReportContainer
      title="XIRR Return Analysis"
      description="Annualized internal rate of return accounting for every irregular cash flow and dividend."
      excelSheets={[
        {
          name: 'XIRR by Holding',
          rows: report.holdings.map((h) => ({
            Symbol: h.symbol,
            AnnualizedXirrPct: h.xirrPct !== null ? `${h.xirrPct.toFixed(2)}%` : 'N/A',
            TotalInvested: h.totalInvested,
            CurrentValue: h.currentValue,
            TotalRealized: h.totalRealized,
            TotalDividends: h.totalDividends,
            FirstDate: h.firstDate ?? 'N/A',
          })),
        },
      ]}
    >
      {/* Top Banner KPI */}
      <div className="bg-card border-border/60 relative overflow-hidden rounded-3xl border p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Overall Portfolio XIRR
              </p>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-4xl font-extrabold tracking-tight font-mono">
                {report.portfolioXirrPct !== null
                  ? `${report.portfolioXirrPct >= 0 ? '+' : ''}${report.portfolioXirrPct.toFixed(2)}%`
                  : 'N/A'}
              </span>
              <span className="text-muted-foreground text-sm font-medium">per annum</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Calculated using Newton-Raphson polynomial solver across all transaction cash flows.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 sm:flex-nowrap">
            <div className="bg-accent/40 rounded-2xl p-4 min-w-32">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <DollarSign className="size-3.5" />
                <span>Total Invested</span>
              </div>
              <p className="mt-1 text-lg font-bold font-mono">{formatINR(report.totalInvested)}</p>
            </div>

            <div className="bg-accent/40 rounded-2xl p-4 min-w-32">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Award className="size-3.5" />
                <span>Current Value</span>
              </div>
              <p className="mt-1 text-lg font-bold font-mono">{formatINR(report.currentPortfolioValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings XIRR Table */}
      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">Annualized Returns by Holding</h2>
        <DataTable
          data={report.holdings}
          columns={columns}
          getRowId={(h) => h.symbol}
          searchPlaceholder="Search holding..."
          searchableText={(h) => h.symbol}
          emptyMessage="No investment cash flows recorded yet."
        />
      </div>
    </ReportContainer>
  );
}
