'use client';

import { useCashbook } from '@/hooks/useCashbook';
import { formatINR } from '@repo/shared/utils/currency';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable, type DataTableColumn, type DataTableFilter } from '@/components/shared/DataTable';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';

interface CashbookPositionRow {
  counterparty: string;
  totalGiven: number;
  totalReceived: number;
  netBalance: number;
  hasOverdue: boolean;
}

export function CashbookNetPositionReport() {
  const { summary, isLoading, error } = useCashbook();
  const rows: [string, { totalGiven: number; totalReceived: number; netBalance: number; hasOverdue: boolean }][] = summary
    ? Object.entries(summary)
    : [];
  const tableRows: CashbookPositionRow[] = rows.map(([counterparty, item]) => ({ counterparty, ...item }));

  if (isLoading) return <LoadingState label="Loading report..." />;
  if (error) return <ErrorState error={error} />;

  const columns: DataTableColumn<CashbookPositionRow>[] = [
    { id: 'counterparty', header: 'Counterparty', cell: (r) => <span className="font-medium">{r.counterparty}</span> },
    { id: 'given', header: 'Given', className: 'text-right', cell: (r) => formatINR(r.totalGiven), sortValue: (r) => r.totalGiven },
    { id: 'received', header: 'Received', className: 'text-right', cell: (r) => formatINR(r.totalReceived), sortValue: (r) => r.totalReceived },
    {
      id: 'netBalance',
      header: 'Net Balance',
      className: 'text-right',
      cell: (r) => (
        <span className={r.netBalance >= 0 ? 'text-success' : 'text-destructive'}>{formatINR(r.netBalance)}</span>
      ),
      sortValue: (r) => r.netBalance,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (r) =>
        r.hasOverdue ? <StatusBadge tone="destructive">Overdue</StatusBadge> : <StatusBadge tone="success">OK</StatusBadge>,
    },
  ];

  const filters: DataTableFilter<CashbookPositionRow>[] = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { label: 'Overdue', value: 'Overdue' },
        { label: 'OK', value: 'OK' },
      ],
      getValue: (r) => (r.hasOverdue ? 'Overdue' : 'OK'),
    },
  ];

  return (
    <ReportContainer
      title="Cashbook Net Position"
      description="Who owes you, who you owe, and what's overdue."
      excelSheets={[
        {
          name: 'Cashbook Net Position',
          rows: rows.map(([counterparty, item]) => ({
            Counterparty: counterparty,
            'Total Given': item.totalGiven,
            'Total Received': item.totalReceived,
            'Net Balance': item.netBalance,
            Overdue: item.hasOverdue ? 'Yes' : 'No',
          })),
        },
      ]}
    >
      <DataTable
        data={tableRows}
        columns={columns}
        getRowId={(r) => r.counterparty}
        searchPlaceholder="Search counterparty…"
        searchableText={(r) => r.counterparty}
        filters={filters}
        emptyMessage="No cashbook entries found."
      />
    </ReportContainer>
  );
}
