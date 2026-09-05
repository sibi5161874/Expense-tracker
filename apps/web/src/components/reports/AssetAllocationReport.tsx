'use client';

import { useMemo, useRef } from 'react';
import { useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { groupInvestmentsBySymbol } from '@repo/shared/logic';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { ExpenseBreakdownChart } from '@/components/shared/ExpenseBreakdownChart';
import { ErrorState } from '@/components/shared/QueryState';
import { ReportSkeleton } from '@/components/shared/ReportSkeleton';

export function AssetAllocationReport() {
  const chartRef = useRef<HTMLDivElement>(null);
  const { data: investments, isLoading, error } = useAllInvestmentLog();

  const holdings = useMemo(() => (investments ? groupInvestmentsBySymbol(investments) : []), [investments]);

  const byAssetType = useMemo(() => {
    const totals = new Map<string, number>();
    for (const h of holdings) {
      totals.set(h.assetType, (totals.get(h.assetType) ?? 0) + h.currentValue);
    }
    return Array.from(totals, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [holdings]);

  const byHolding = useMemo(
    () => holdings.map((h) => ({ name: h.symbol, value: h.currentValue })).sort((a, b) => b.value - a.value),
    [holdings]
  );

  if (isLoading) return <ReportSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <ReportContainer
      title="Asset Allocation"
      description="Portfolio split by asset type and by individual holding."
      excelSheets={[
        { name: 'By Asset Type', rows: byAssetType.map((a) => ({ 'Asset Type': a.name, 'Current Value': a.value })) },
        { name: 'By Holding', rows: byHolding.map((h) => ({ Symbol: h.name, 'Current Value': h.value })) },
      ]}
      chartRef={chartRef}
    >
      <div ref={chartRef} className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">By Asset Type</h2>
          <ExpenseBreakdownChart data={byAssetType} />
        </div>
        <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">By Holding</h2>
          <ExpenseBreakdownChart data={byHolding} />
        </div>
      </div>
    </ReportContainer>
  );
}
