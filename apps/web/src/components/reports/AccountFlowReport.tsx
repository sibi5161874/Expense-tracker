'use client';

import { useMemo, useRef } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useTransactionsInRange, monthsAgo } from '@/hooks/useReportsData';
import { formatINR } from '@repo/shared/utils/currency';
import { formatMonth } from '@repo/shared/utils';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { AmountText } from '@/components/shared/AmountText';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { ErrorState } from '@/components/shared/QueryState';
import { ReportSkeleton } from '@/components/shared/ReportSkeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';

const ACCOUNT_FLOW_CONFIG: ChartConfig = {
  in: { label: 'In', color: 'var(--chart-1)' },
  out: { label: 'Out', color: 'var(--chart-3)' },
};

interface AccountFlowRow {
  name: string;
  in: number;
  out: number;
  net: number;
}

const MONTHS_BACK = 3;

export function AccountFlowReport() {
  const chartRef = useRef<HTMLDivElement>(null);
  const from = monthsAgo(MONTHS_BACK - 1);
  const to = formatMonth(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)) + '-01';
  const { data: transactions, isLoading, error } = useTransactionsInRange(from, to);

  const rows = useMemo(() => {
    const byAccount = new Map<string, { name: string; in: number; out: number }>();
    const ensure = (id: string, name: string) => {
      if (!byAccount.has(id)) byAccount.set(id, { name, in: 0, out: 0 });
      return byAccount.get(id)!;
    };

    for (const t of transactions ?? []) {
      if (t.type === 'Income') {
        ensure(t.from_account_id, t.from_account?.name ?? 'Unknown').in += t.amount;
      } else if (t.type === 'Expense') {
        ensure(t.from_account_id, t.from_account?.name ?? 'Unknown').out += t.amount;
      } else {
        ensure(t.from_account_id, t.from_account?.name ?? 'Unknown').out += t.amount;
        if (t.to_account_id) {
          ensure(t.to_account_id, t.to_account?.name ?? 'Unknown').in += t.amount;
        }
      }
    }

    return Array.from(byAccount.values())
      .map((a) => ({ ...a, net: a.in - a.out }))
      .sort((a, b) => b.in - a.in);
  }, [transactions]);

  if (isLoading) return <ReportSkeleton />;
  if (error) return <ErrorState error={error} />;

  const columns: DataTableColumn<AccountFlowRow>[] = [
    { id: 'account', header: 'Account', cell: (r) => <span className="font-medium">{r.name}</span> },
    { id: 'in', header: 'In', className: 'text-right', cell: (r) => <AmountText value={r.in} sign="positive" />, sortValue: (r) => r.in },
    { id: 'out', header: 'Out', className: 'text-right', cell: (r) => <AmountText value={r.out} sign="negative" />, sortValue: (r) => r.out },
    { id: 'net', header: 'Net', className: 'text-right', cell: (r) => <AmountText value={r.net} />, sortValue: (r) => r.net },
  ];

  return (
    <ReportContainer
      title="Account-wise Flow"
      description={`Money in vs out per account over the last ${MONTHS_BACK} months.`}
      excelSheets={[
        {
          name: 'Account Flow',
          rows: rows.map((r) => ({ Account: r.name, In: r.in, Out: r.out, Net: r.net })),
        },
      ]}
      chartRef={chartRef}
    >
      <div ref={chartRef} className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">Net Flow per Account</h2>
        <ChartContainer
          config={ACCOUNT_FLOW_CONFIG}
          height={Math.max(200, rows.length * 45)}
          chart={
            <BarChart data={rows} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.6} />
              <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
              <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent formatter={formatINR} />} />
              <Bar dataKey="in" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={24} />
              <Bar dataKey="out" fill="var(--chart-3)" radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          }
        >
          <ChartLegendContent items={['in', 'out']} />
        </ChartContainer>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.name}
        searchPlaceholder="Search account…"
        searchableText={(r) => r.name}
      />
    </ReportContainer>
  );
}
