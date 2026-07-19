'use client';

import { useMemo } from 'react';
import { useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { formatINR } from '@repo/shared/utils/currency';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { CashFlowChart } from '@/components/shared/CashFlowChart';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';

interface DividendHoldingRow {
  symbol: string;
  amount: number;
}

export function DividendIncomeReport() {
  const { data: investments, isLoading, error } = useAllInvestmentLog();

  const { byHolding, byMonth, total } = useMemo(() => {
    const dividends = (investments ?? []).filter((i) => i.action === 'DIVIDEND');

    const holdingTotals = new Map<string, number>();
    const monthTotals = new Map<string, number>();
    for (const d of dividends) {
      holdingTotals.set(d.symbol, (holdingTotals.get(d.symbol) ?? 0) + d.price);
      const month = d.date.slice(0, 7);
      monthTotals.set(month, (monthTotals.get(month) ?? 0) + d.price);
    }

    const byHolding = Array.from(holdingTotals, ([symbol, amount]) => ({ symbol, amount })).sort(
      (a, b) => b.amount - a.amount
    );
    const byMonth = Array.from(monthTotals, ([month, income]) => ({
      month,
      label: new Date(`${month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      income,
      expense: 0,
    })).sort((a, b) => a.month.localeCompare(b.month));

    return { byHolding, byMonth, total: dividends.reduce((sum, d) => sum + d.price, 0) };
  }, [investments]);

  if (isLoading) return <LoadingState label="Loading report..." />;
  if (error) return <ErrorState error={error} />;

  const columns: DataTableColumn<DividendHoldingRow>[] = [
    { id: 'symbol', header: 'Holding', cell: (h) => <span className="font-medium">{h.symbol}</span> },
    {
      id: 'amount',
      header: 'Total Dividends',
      className: 'text-right',
      cell: (h) => formatINR(h.amount),
      sortValue: (h) => h.amount,
    },
  ];

  return (
    <ReportContainer
      title="Dividend Income"
      description={`Total dividends received: ${formatINR(total)}.`}
      excelSheets={[
        { name: 'By Holding', rows: byHolding.map((h) => ({ Symbol: h.symbol, Amount: h.amount })) },
        { name: 'By Month', rows: byMonth.map((m) => ({ Month: m.month, Amount: m.income })) },
      ]}
    >
      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">Dividend Income Over Time</h2>
        {byMonth.length > 0 ? (
          <CashFlowChart data={byMonth} />
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">No dividends recorded yet.</p>
        )}
      </div>

      <DataTable
        data={byHolding}
        columns={columns}
        getRowId={(h) => h.symbol}
        searchPlaceholder="Search holding…"
        searchableText={(h) => h.symbol}
        emptyMessage="No dividends recorded yet."
      />
    </ReportContainer>
  );
}
