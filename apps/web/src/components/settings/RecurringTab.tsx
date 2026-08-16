'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { RecurringTransactionForm } from '@/components/RecurringTransactionForm';
import { RecurringTransactionRow } from '@/components/settings/RecurringTransactionRow';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import type { getRecurringTransactions } from '@repo/shared/queries/recurringTransactions';

type RecurringTransaction = NonNullable<Awaited<ReturnType<typeof getRecurringTransactions>>>[number];

export function RecurringTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const {
    data: recurringTransactions,
    isLoading,
    error,
    deleteRecurringTransaction,
    updateRecurringTransaction,
    isDeleting,
  } = useRecurringTransactions();

  const handleDelete = useCallback((id: string) => deleteRecurringTransaction(id), [deleteRecurringTransaction]);
  const handleToggleActive = useCallback(
    (rt: RecurringTransaction) => updateRecurringTransaction({ id: rt.id, data: { is_active: !rt.is_active } }),
    [updateRecurringTransaction]
  );
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditing(null);
  }, []);

  if (isLoading) return <LoadingState label="Loading recurring transactions..." />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4" />
          Add Recurring Transaction
        </Button>
      </div>

      <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recurringTransactions?.map((rt) => (
              <RecurringTransactionRow
                key={rt.id}
                recurringTransaction={rt}
                onEdit={setEditing}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                isDeleting={isDeleting}
              />
            ))}
            {recurringTransactions?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground h-32 text-center">
                  No recurring transactions set up. Add rent, salary, or EMIs to auto-generate them each period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(showForm || editing) && (
        <RecurringTransactionForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editing
              ? {
                  id: editing.id,
                  type: editing.type,
                  category_id: editing.category_id,
                  sub_category: editing.sub_category ?? undefined,
                  amount: editing.amount,
                  from_account_id: editing.from_account_id,
                  to_account_id: editing.to_account_id,
                  notes: editing.notes ?? undefined,
                  frequency: editing.frequency,
                  next_run_date: editing.next_run_date,
                  is_active: editing.is_active,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
