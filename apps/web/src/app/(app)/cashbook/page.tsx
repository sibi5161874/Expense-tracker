'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { useCashbook } from '@/hooks/useCashbook';
import { CashbookForm } from '@/components/CashbookForm';
import { CounterpartySummaryCard } from '@/components/cashbook/CounterpartySummaryCard';
import { CashbookRow } from '@/components/cashbook/CashbookRow';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import type { getCashbook } from '@repo/shared/queries/cashbook';

type CashbookEntry = NonNullable<Awaited<ReturnType<typeof getCashbook>>>[number];

export default function CashbookPage() {
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CashbookEntry | null>(null);
  const { data: cashbook, summary, isLoading, error, deleteCashbook, isDeleting } = useCashbook({ page });

  const handleEdit = useCallback((entry: CashbookEntry) => setEditingEntry(entry), []);
  const handleDelete = useCallback((id: string) => deleteCashbook(id), [deleteCashbook]);
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingEntry(null);
  }, []);

  return (
    <div>
      <PageHeader
        title="Cashbook"
        description="Track personal lending and borrowing."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            Add Entry
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading cashbook..." />
      ) : error ? (
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

          <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Flow</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashbook?.map((entry) => (
                  <CashbookRow
                    key={entry.id}
                    entry={entry}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                  />
                ))}
                {cashbook?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground h-32 text-center">
                      No cashbook entries found. Add your first entry to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button variant="outline" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
              Previous
            </Button>
            <span className="text-muted-foreground text-sm">Page {page + 1}</span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={!cashbook || cashbook.length < 50}
            >
              Next
            </Button>
          </div>
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
    </div>
  );
}
