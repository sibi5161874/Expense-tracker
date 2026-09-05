'use client';

import { useMemo, useRef } from 'react';
import { Cell, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { groupInvestmentsBySymbol } from '@repo/shared/logic';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { ErrorState } from '@/components/shared/QueryState';
import { ReportSkeleton } from '@/components/shared/ReportSkeleton';

interface PerformerRow {
  symbol: string;
  returnPct: number;
}

export function BestWorstPerformersReport() {
  const chartRef = useRef<HTMLDivElement>(null);
  const { data: investments, isLoading, error } = useAllInvestmentLog();

  const holdings = useMemo(() => {
    const grouped = investments ? groupInvestmentsBySymbol(investments) : [];
    return [...grouped]
      .sort((a, b) => b.returnPct - a.returnPct)
      .map((h) => ({ symbol: h.symbol, returnPct: Number((h.returnPct * 100).toFixed(2)) }));
  }, [investments]);

  if (isLoading) return <ReportSkeleton />;
  if (error) return <ErrorState error={error} />;

  const columns: DataTableColumn<PerformerRow>[] = [
    { id: 'symbol', header: 'Symbol', cell: (h) => <span className="font-medium">{h.symbol}</span> },
    {
      id: 'returnPct',
      header: 'Return %',
      className: 'text-right',
      cell: (h) => <span className={h.returnPct >= 0 ? 'text-success' : 'text-destructive'}>{h.returnPct}%</span>,
      sortValue: (h) => h.returnPct,
    },
  ];

  return (
    <ReportContainer
      title="Best/Worst Performing Holdings"
      description="Holdings ranked by unrealised return %."
      excelSheets={[{ name: 'Performance', rows: holdings.map((h) => ({ Symbol: h.symbol, 'Return %': h.returnPct })) }]}
      chartRef={chartRef}
    >
      {holdings.length === 0 ? (
        <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center">
          No holdings found. Add your first investment to get started.
        </div>
      ) : (
        <>
          <div ref={chartRef} className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold">Return % by Holding</h2>
            <ResponsiveContainer width="100%" height={Math.max(200, holdings.length * 40)}>
              <BarChart data={holdings} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="symbol"
                  width={90}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    color: 'var(--popover-foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: 12,
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Bar dataKey="returnPct" name="Return %" radius={[0, 4, 4, 0]}>
                  {holdings.map((h) => (
                    <Cell key={h.symbol} fill={h.returnPct >= 0 ? 'var(--success)' : 'var(--destructive)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <DataTable
            data={holdings}
            columns={columns}
            getRowId={(h) => h.symbol}
            searchPlaceholder="Search symbol…"
            searchableText={(h) => h.symbol}
          />
        </>
      )}
    </ReportContainer>
  );
}
