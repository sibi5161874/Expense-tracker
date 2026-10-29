'use client';

import { useMemo, useRef } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useBudgetLimits } from '@/hooks/useBudgetLimits';
import { useMonthlyOverview } from '@/hooks/useTransactions';
import { calculateBudgetStatus } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { formatMonth } from '@repo/shared/utils';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable, type DataTableColumn, type DataTableFilter } from '@/components/shared/DataTable';
import { ErrorState } from '@/components/shared/QueryState';
import { ReportSkeleton } from '@/components/shared/ReportSkeleton';
import { budgetStatusTone } from '@/lib/badgeTones';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';

const BUDGET_CONFIG: ChartConfig = {
  limit: { label: 'Budget', color: 'var(--chart-2)' },
  actual: { label: 'Actual', color: 'var(--chart-3)' },
};

interface BudgetRow {
  category: string;
  limit: number;
  actual: number;
  status: string;
}

export function BudgetVsActualReport() {
  const chartRef = useRef<HTMLDivElement>(null);
  const currentMonth = formatMonth(new Date());
  const { data: budgetLimits, isLoading: budgetsLoading, error: budgetsError } = useBudgetLimits();
  const { categoryBreakdown, isLoading: overviewLoading, error: overviewError } = useMonthlyOverview(currentMonth);

  const rows = useMemo(() => {
    if (!budgetLimits) return [];
    return budgetLimits.map((limit) => {
      const actual = categoryBreakdown.find((c) => c.name === limit.category?.name)?.value ?? 0;
      return {
        category: limit.category?.name ?? 'Unknown',
        limit: limit.monthly_limit,
        actual,
        status: calculateBudgetStatus(actual, limit.monthly_limit),
      };
    });
  }, [budgetLimits, categoryBreakdown]);

  if (budgetsLoading || overviewLoading) return <ReportSkeleton />;
  if (budgetsError) return <ErrorState error={budgetsError} />;
  if (overviewError) return <ErrorState error={overviewError} />;

  const columns: DataTableColumn<BudgetRow>[] = [
    { id: 'category', header: 'Category', cell: (r) => <span className="font-medium">{r.category}</span> },
    { id: 'limit', header: 'Budget', className: 'text-right', cell: (r) => formatINR(r.limit), sortValue: (r) => r.limit },
    { id: 'actual', header: 'Actual', className: 'text-right', cell: (r) => formatINR(r.actual), sortValue: (r) => r.actual },
    { id: 'status', header: 'Status', cell: (r) => <StatusBadge tone={budgetStatusTone(r.status)}>{r.status}</StatusBadge> },
  ];

  const statuses = Array.from(new Set(rows.map((r) => r.status)));
  const filters: DataTableFilter<BudgetRow>[] = [
    { id: 'status', label: 'Status', options: statuses.map((s) => ({ label: s, value: s })), getValue: (r) => r.status },
  ];

  return (
    <ReportContainer
      title="Budget vs Actual"
      description={`Spend against your monthly limit for ${currentMonth}.`}
      excelSheets={[
        {
          name: 'Budget vs Actual',
          rows: rows.map((r) => ({
            Category: r.category,
            'Budget Limit': r.limit,
            Actual: r.actual,
            Status: r.status,
          })),
        },
      ]}
      chartRef={chartRef}
    >
      {rows.length === 0 ? (
        <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center">
          No budget limits set yet. Add some in Settings → Budgets to see this report.
        </div>
      ) : (
        <>
          <div ref={chartRef} className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold">Budget vs Actual</h2>
            <ChartContainer
              config={BUDGET_CONFIG}
              height={Math.max(200, rows.length * 50)}
              chart={
                <BarChart data={rows} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.6} />
                  <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={110}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent formatter={formatINR} />} />
                  <Bar dataKey="limit" fill="var(--chart-2)" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  <Bar dataKey="actual" fill="var(--chart-3)" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              }
            >
              <ChartLegendContent items={['limit', 'actual']} />
            </ChartContainer>
          </div>

          <DataTable
            data={rows}
            columns={columns}
            getRowId={(r) => r.category}
            searchPlaceholder="Search category…"
            searchableText={(r) => r.category}
            filters={filters}
          />
        </>
      )}
    </ReportContainer>
  );
}
