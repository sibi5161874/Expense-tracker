'use client';

import { useCallback, useState } from 'react';
import { Plus, Download, UploadCloud, Pencil, Trash2 } from 'lucide-react';
import { useCashbook } from '@/hooks/useCashbook';
import { CashbookForm } from '@/components/CashbookForm';
import { CounterpartySummaryCard } from '@/components/cashbook/CounterpartySummaryCard';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { DataTable, type DataTableColumn, type DataTableFilter } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { AmountText } from '@/components/shared/AmountText';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/QueryState';
import { cashbookFlowTone } from '@/lib/badgeTones';
import { downloadCsvTemplate } from '@/lib/downloadCsvTemplate';
import { CASHBOOK_TEMPLATE_COLUMNS, CASHBOOK_TEMPLATE_EXAMPLE_ROW } from '@repo/shared';
import type { getCashbook } from '@repo/shared/queries/cashbook';

type CashbookEntry = NonNullable<Awaited<ReturnType<typeof getCashbook>>>[number];

export default function CashbookPage() {
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CashbookEntry | null>(null);
  const { data: cashbook, summary, isLoading, error, deleteCashbook, isDeleting } = useCashbook({ page });

  const handleEdit = useCallback((entry: CashbookEntry) => setEditingEntry(entry), []);
  const handleDelete = useCallback((id: string) => deleteCashbook(id), [deleteCashbook]);
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingEntry(null);
  }, []);

  const columns: DataTableColumn<CashbookEntry>[] = [
    { id: 'date', header: 'Date', cell: (c) => <span className="text-muted-foreground">{c.date}</span>, sortValue: (c) => c.date },
    { id: 'counterparty', header: 'Counterparty', cell: (c) => <span className="font-medium">{c.counterparty}</span> },
    { id: 'flow', header: 'Flow', cell: (c) => <StatusBadge tone={cashbookFlowTone(c.flow)}>{c.flow}</StatusBadge> },
    {
      id: 'amount',
      header: 'Amount',
      className: 'text-right',
      cell: (c) => <AmountText value={c.amount} colorBySign={false} />,
      sortValue: (c) => c.amount,
    },
    { id: 'dueDate', header: 'Due Date', cell: (c) => <span className="text-muted-foreground">{c.due_date || '-'}</span> },
    { id: 'account', header: 'Account', cell: (c) => c.account_used?.name ?? '-' },
  ];

  const filters: DataTableFilter<CashbookEntry>[] = [
    {
      id: 'flow',
      label: 'Flow',
      options: [
        { label: 'Gave', value: 'Gave' },
        { label: 'Received', value: 'Received' },
      ],
      getValue: (c) => c.flow,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Cashbook"
        description="Track personal lending and borrowing."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                downloadCsvTemplate('cashbook-template.csv', CASHBOOK_TEMPLATE_COLUMNS, CASHBOOK_TEMPLATE_EXAMPLE_ROW)
              }
            >
              <Download className="size-4" />
              Download Template
            </Button>
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <UploadCloud className="size-4" />
              Import CSV
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="size-4" />
              Add Entry
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorState error={error} />
      ) : (
        <>
          {summary && Object.keys(summary).length > 0 && (
            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(summary).map(([counterparty, item]) => (
                <CounterpartySummaryCard key={counterparty} counterparty={counterparty} {...item} />
              ))}
            </div>
          )}

          <DataTable
            data={cashbook}
            isLoading={isLoading}
            columns={columns}
            getRowId={(c) => c.id}
            searchPlaceholder="Search counterparty, account…"
            searchableText={(c) => `${c.counterparty} ${c.account_used?.name ?? ''}`}
            filters={filters}
            selectable
            bulkActions={(ids, clear) => (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm(`Delete ${ids.length} entr${ids.length === 1 ? 'y' : 'ies'}?`)) {
                    ids.forEach((id) => handleDelete(id));
                    clear();
                  }
                }}
              >
                <Trash2 className="size-3.5" />
                Delete selected
              </Button>
            )}
            rowActions={(c) => (
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground size-8"
                  onClick={() => handleEdit(c)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive size-8"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this entry?')) handleDelete(c.id);
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
            emptyMessage="No cashbook entries found. Add your first entry to get started."
            page={page}
            onPageChange={setPage}
            hasNextPage={!!cashbook && cashbook.length >= 50}
          />
        </>
      )}

      {(showForm || editingEntry) && (
        <CashbookForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingEntry
              ? {
                  id: editingEntry.id,
                  date: editingEntry.date,
                  counterparty: editingEntry.counterparty,
                  flow: editingEntry.flow,
                  amount: editingEntry.amount,
                  due_date: editingEntry.due_date ?? undefined,
                  account_used_id: editingEntry.account_used_id ?? undefined,
                  loan_id: editingEntry.loan_id ?? undefined,
                  notes: editingEntry.notes ?? undefined,
                }
              : undefined
          }
        />
      )}

      {showImport && (
        <ImportDialog
          apiPath="/api/import/cashbook"
          entityLabel="cashbook"
          invalidateQueryKeys={[['cashbook'], ['cashbookSummary']]}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
