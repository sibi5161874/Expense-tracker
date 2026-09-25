'use client';

import { useMemo, useState } from 'react';
import { useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { computeCapitalGains, type MatchedTrade } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { ErrorState } from '@/components/shared/QueryState';
import { ReportSkeleton } from '@/components/shared/ReportSkeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CapitalGainsReport() {
  const { data: investments, isLoading, error } = useAllInvestmentLog();
  const [selectedFY, setSelectedFY] = useState<string>('all');

  const report = useMemo(() => {
    return computeCapitalGains(investments ?? []);
  }, [investments]);

  const { filteredTrades, activeSummary } = useMemo(() => {
    if (selectedFY === 'all') {
      const totalProceeds = report.allTrades.reduce((sum, t) => sum + t.sellProceeds, 0);
      const totalCost = report.allTrades.reduce((sum, t) => sum + t.buyCost, 0);
      const stcgTrades = report.allTrades.filter((t) => t.taxType === 'STCG');
      const ltcgTrades = report.allTrades.filter((t) => t.taxType === 'LTCG');

      const stcgGains = stcgTrades.filter((t) => t.gain >= 0).reduce((sum, t) => sum + t.gain, 0);
      const stcgLosses = stcgTrades.filter((t) => t.gain < 0).reduce((sum, t) => sum + Math.abs(t.gain), 0);
      const ltcgGains = ltcgTrades.filter((t) => t.gain >= 0).reduce((sum, t) => sum + t.gain, 0);
      const ltcgLosses = ltcgTrades.filter((t) => t.gain < 0).reduce((sum, t) => sum + Math.abs(t.gain), 0);

      return {
        filteredTrades: report.allTrades,
        activeSummary: {
          financialYear: 'All Years',
          totalSellProceeds: totalProceeds,
          totalCostBasis: totalCost,
          stcgGains,
          stcgLosses,
          netStcg: stcgGains - stcgLosses,
          ltcgGains,
          ltcgLosses,
          netLtcg: ltcgGains - ltcgLosses,
          totalNetGains: stcgGains - stcgLosses + (ltcgGains - ltcgLosses),
        },
      };
    }

    const s = report.summariesByFY[selectedFY];
    return {
      filteredTrades: s ? s.trades : [],
      activeSummary: s ?? {
        financialYear: selectedFY,
        totalSellProceeds: 0,
        totalCostBasis: 0,
        stcgGains: 0,
        stcgLosses: 0,
        netStcg: 0,
        ltcgGains: 0,
        ltcgLosses: 0,
        netLtcg: 0,
        totalNetGains: 0,
      },
    };
  }, [report, selectedFY]);

  if (isLoading) return <ReportSkeleton />;
  if (error) return <ErrorState error={error} />;

  const columns: DataTableColumn<MatchedTrade>[] = [
    {
      id: 'symbol',
      header: 'Security',
      cell: (t) => (
        <div>
          <span className="font-semibold">{t.symbol}</span>
          <span className="text-muted-foreground ml-1.5 text-xs">({t.assetType})</span>
        </div>
      ),
      sortValue: (t) => t.symbol,
    },
    {
      id: 'type',
      header: 'Category',
      cell: (t) => (
        <Badge variant={t.taxType === 'LTCG' ? 'secondary' : 'outline'} className="text-xs">
          {t.taxType} ({t.holdingDays}d)
        </Badge>
      ),
      sortValue: (t) => t.holdingDays,
    },
    {
      id: 'dates',
      header: 'Buy / Sell Date',
      cell: (t) => (
        <div className="text-xs">
          <div>{t.buyDate}</div>
          <div className="text-muted-foreground">{t.sellDate}</div>
        </div>
      ),
      sortValue: (t) => t.sellDate,
    },
    {
      id: 'quantity',
      header: 'Quantity',
      className: 'text-right',
      cell: (t) => String(t.quantity),
      sortValue: (t) => t.quantity,
    },
    {
      id: 'cost',
      header: 'Buy Cost',
      className: 'text-right',
      cell: (t) => formatINR(t.buyCost),
      sortValue: (t) => t.buyCost,
    },
    {
      id: 'proceeds',
      header: 'Sell Proceeds',
      className: 'text-right',
      cell: (t) => formatINR(t.sellProceeds),
      sortValue: (t) => t.sellProceeds,
    },
    {
      id: 'gain',
      header: 'Realized P&L',
      className: 'text-right',
      cell: (t) => {
        const isPositive = t.gain >= 0;
        return (
          <div>
            <div className={`font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isPositive ? '+' : ''}{formatINR(t.gain)}
            </div>
            <div className="text-muted-foreground text-xs">
              {isPositive ? '+' : ''}{t.gainPct.toFixed(1)}%
            </div>
          </div>
        );
      },
      sortValue: (t) => t.gain,
    },
  ];

  return (
    <ReportContainer
      title="Capital Gains Report (STCG / LTCG)"
      description="FIFO lot matching and tax classification for Indian filing seasons."
      excelSheets={[
        {
          name: 'Capital Gains',
          rows: filteredTrades.map((t) => ({
            Symbol: t.symbol,
            AssetType: t.assetType,
            BuyDate: t.buyDate,
            SellDate: t.sellDate,
            HoldingDays: t.holdingDays,
            TaxType: t.taxType,
            Quantity: t.quantity,
            BuyPrice: t.buyPrice,
            SellPrice: t.sellPrice,
            BuyCost: t.buyCost,
            SellProceeds: t.sellProceeds,
            RealizedGain: t.gain,
            GainPct: t.gainPct,
            FinancialYear: t.financialYear,
          })),
        },
      ]}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Financial Year:</span>
          <Select value={selectedFY} onValueChange={(val) => { if (val) setSelectedFY(val); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select FY" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Financial Years</SelectItem>
              {report.availableFYs.map((fy) => (
                <SelectItem key={fy} value={fy}>
                  {fy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border-border/60 rounded-2xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total Realized P&L</p>
          <p className={`mt-2 text-2xl font-bold ${activeSummary.totalNetGains >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {activeSummary.totalNetGains >= 0 ? '+' : ''}{formatINR(activeSummary.totalNetGains)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Proceeds: {formatINR(activeSummary.totalSellProceeds)}
          </p>
        </div>

        <div className="bg-card border-border/60 rounded-2xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Short Term (STCG)</p>
          <p className={`mt-2 text-2xl font-bold ${activeSummary.netStcg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {activeSummary.netStcg >= 0 ? '+' : ''}{formatINR(activeSummary.netStcg)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Gains: {formatINR(activeSummary.stcgGains)} | Losses: {formatINR(activeSummary.stcgLosses)}
          </p>
        </div>

        <div className="bg-card border-border/60 rounded-2xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Long Term (LTCG)</p>
          <p className={`mt-2 text-2xl font-bold ${activeSummary.netLtcg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {activeSummary.netLtcg >= 0 ? '+' : ''}{formatINR(activeSummary.netLtcg)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Gains: {formatINR(activeSummary.ltcgGains)} | Losses: {formatINR(activeSummary.ltcgLosses)}
          </p>
        </div>

        <div className="bg-card border-border/60 rounded-2xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total Cost Basis</p>
          <p className="mt-2 text-2xl font-bold">
            {formatINR(activeSummary.totalCostBasis)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {filteredTrades.length} matched trade{filteredTrades.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">Matched Realized Transactions (FIFO)</h2>
        <DataTable
          data={filteredTrades}
          columns={columns}
          getRowId={(t) => `${t.symbol}-${t.sellDate}-${t.buyDate}-${t.quantity}`}
          searchPlaceholder="Search by symbol or asset..."
          searchableText={(t) => `${t.symbol} ${t.assetType} ${t.taxType}`}
          emptyMessage="No realized trades found in this financial year."
        />
      </div>
    </ReportContainer>
  );
}
