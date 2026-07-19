'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Receipt, Download, UploadCloud, Pencil, Trash2 } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionForm } from '@/components/TransactionForm';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { DataTable, type DataTableColumn, type DataTableFilter } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { AmountText } from '@/components/shared/AmountText';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/QueryState';
import { EmptyState } from '@/components/shared/EmptyState';
import { transactionTypeTone } from '@/lib/badgeTones';
import { downloadCsvTemplate } from '@/lib/downloadCsvTemplate';
import { TRANSACTIONS_TEMPLATE_COLUMNS, TRANSACTIONS_TEMPLATE_EXAMPLE_ROW } from '@repo/shared';
import type { getTransactions } from '@repo/shared/queries/transactions';

type Transaction = NonNullable<Awaited<ReturnType<typeof getTransactions>>>[number];

export default function TransactionsPage() {
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { data: transactions, isLoading, error, deleteTransaction, isDeleting } = useTransactions({ page });

  // Stagger-fade rows in only on the very first successful load — never on pagination or refetch.
  const hasAnimatedRef = useRef(false);
  const shouldAnimateRows = !isLoading && !hasAnimatedRef.current;
  useEffect(() => {
    if (!isLoading) hasAnimatedRef.current = true;
  }, [isLoading]);

  const handleEdit = useCallback((transaction: Transaction) => setEditingTransaction(transaction), []);
  const handleDelete = useCallback((id: string) => deleteTransaction(id), [deleteTransaction]);
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingTransaction(null);
  }, []);

  const columns: DataTableColumn<Transaction>[] = [
    {
      id: 'date',
      header: 'Date',
      cell: (t) => <span className="text-muted-foreground font-mono tabular-nums">{t.date}</span>,
      sortValue: (t) => t.date,
    },
    {
      id: 'type',
      header: 'Type',
      cell: (t) => <StatusBadge tone={transactionTypeTone(t.type)}>{t.type}</StatusBadge>,
    },
    { id: 'category', header: 'Category', cell: (t) => t.category?.name ?? '-' },
    {
      id: 'amount',
      header: 'Amount',
      className: 'text-right',
      cell: (t) => (
        <AmountText value={t.amount} sign={t.type === 'Income' ? 'positive' : t.type === 'Expense' ? 'negative' : 'neutral'} />
      ),
      sortValue: (t) => t.amount,
    },
    { id: 'account', header: 'Account', cell: (t) => t.from_account?.name ?? '-' },
    {
      id: 'notes',
      header: 'Notes',
      cell: (t) => <span className="text-muted-foreground max-w-48 truncate">{t.notes || '-'}</span>,
    },
  ];

  const filters: DataTableFilter<Transaction>[] = [
    {
      id: 'type',
      label: 'Type',
      options: [
        { label: 'Income', value: 'Income' },
        { label: 'Expense', value: 'Expense' },
        { label: 'Transfer', value: 'Transfer' },
      ],
      getValue: (t) => t.type,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Track your income, expenses, and transfers."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                downloadCsvTemplate(
                  'transactions-template.csv',
                  TRANSACTIONS_TEMPLATE_COLUMNS,
                  TRANSACTIONS_TEMPLATE_EXAMPLE_ROW
                )
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
              Add Transaction
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorState error={error} />
      ) : !isLoading && transactions?.length === 0 && page === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Log your first income, expense, or transfer to start tracking your cash flow."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="size-4" />
              Add Transaction
            </Button>
          }
        />
      ) : (
        <DataTable
          data={transactions}
          isLoading={isLoading}
          columns={columns}
          getRowId={(t) => t.id}
          searchPlaceholder="Search category, account, notes…"
          searchableText={(t) => `${t.category?.name ?? ''} ${t.from_account?.name ?? ''} ${t.notes ?? ''}`}
          filters={filters}
          selectable
          bulkActions={(ids, clear) => (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm(`Delete ${ids.length} transaction${ids.length === 1 ? '' : 's'}?`)) {
                  ids.forEach((id) => handleDelete(id));
                  clear();
                }
              }}
            >
              <Trash2 className="size-3.5" />
              Delete selected
            </Button>
          )}
          rowActions={(t) => (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground size-8"
                onClick={() => handleEdit(t)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-8"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this transaction?')) handleDelete(t.id);
                }}
                disabled={isDeleting}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}
          emptyMessage="No transactions on this page."
          page={page}
          onPageChange={setPage}
          hasNextPage={!!transactions && transactions.length >= 50}
          animateRows={shouldAnimateRows}
        />
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

      {showImport && (
        <ImportDialog
          apiPath="/api/import/transactions"
          entityLabel="transaction"
          invalidateQueryKeys={[['transactions'], ['monthlyOverview']]}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
