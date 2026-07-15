'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import type { getTransactions } from '@repo/shared/queries/transactions';

type Transaction = NonNullable<Awaited<ReturnType<typeof getTransactions>>>[number];

export default function TransactionsPage() {
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { data: transactions, isLoading, error, deleteTransaction, isDeleting } = useTransactions({ page });

  const handleEdit = useCallback((transaction: Transaction) => setEditingTransaction(transaction), []);
  const handleDelete = useCallback((id: string) => deleteTransaction(id), [deleteTransaction]);
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingTransaction(null);
  }, []);

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Track your income, expenses, and transfers."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            Add Transaction
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading transactions..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <>
          <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                  />
                ))}
                {transactions?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground h-32 text-center">
                      No transactions found. Add your first transaction to get started.
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
              disabled={!transactions || transactions.length < 50}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {(showForm || editingTransaction) && (
        <TransactionForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingTransaction
              ? {
                  id: editingTransaction.id,
                  date: editingTransaction.date,
                  type: editingTransaction.type,
                  amount: editingTransaction.amount,
                  from_account_id: editingTransaction.from_account_id,
                  category_id: editingTransaction.category_id ?? undefined,
                  sub_category: editingTransaction.sub_category ?? undefined,
                  to_account_id: editingTransaction.to_account_id ?? undefined,
                  notes: editingTransaction.notes ?? undefined,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
