'use client';

import { useMonthlyOverview } from '@/hooks/useTransactions';
import { formatINR } from '@repo/shared/utils/currency';
import { formatMonth } from '@repo/shared/utils';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { ExpenseBreakdownChart } from '@/components/shared/ExpenseBreakdownChart';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';

interface CategoryRow {
  name: string;
  value: number;
}

export function CategoryBreakdownReport() {
  const currentMonth = formatMonth(new Date());
  const { categoryBreakdown, expense, isLoading, error } = useMonthlyOverview(currentMonth);

  if (isLoading) return <LoadingState label="Loading report..." />;
  if (error) return <ErrorState error={error} />;

  const columns: DataTableColumn<CategoryRow>[] = [
    { id: 'category', header: 'Category', cell: (c) => <span className="font-medium">{c.name}</span> },
    { id: 'amount', header: 'Amount', className: 'text-right', cell: (c) => formatINR(c.value), sortValue: (c) => c.value },
    {
      id: 'share',
      header: 'Share',
      className: 'text-right',
      cell: (c) => (expense > 0 ? `${((c.value / expense) * 100).toFixed(1)}%` : '-'),
      sortValue: (c) => (expense > 0 ? c.value / expense : 0),
    },
  ];

  return (
    <ReportContainer
      title="Category Breakdown"
      description={`Where your money went in ${currentMonth}.`}
      excelSheets={[
        {
          name: 'Category Breakdown',
          rows: categoryBreakdown.map((c) => ({
            Category: c.name,
            Amount: c.value,
            'Share (%)': expense > 0 ? Number(((c.value / expense) * 100).toFixed(1)) : 0,
          })),
        },
      ]}
    >
      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">Expenses by Category</h2>
        <ExpenseBreakdownChart data={categoryBreakdown} />
      </div>

      <DataTable
        data={categoryBreakdown}
        columns={columns}
        getRowId={(c) => c.name}
        searchPlaceholder="Search category…"
        searchableText={(c) => c.name}
        emptyMessage="No expenses recorded this month."
      />
    </ReportContainer>
  );
}
