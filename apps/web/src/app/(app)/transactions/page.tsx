'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Receipt, Download, UploadCloud, Landmark, Pencil, Trash2 } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useEntitlements } from '@/hooks/useEntitlements';
import { TransactionForm } from '@/components/TransactionForm';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { BankStatementImportDialog } from '@/components/shared/BankStatementImportDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ProLockedButton } from '@/components/shared/ProGate';
import { DataTable, type DataTableColumn, type DataTableFilter } from '@/components/shared/DataTable';
import { TransactionsCalendarView } from '@/components/transactions/TransactionsCalendarView';
import { SegmentedControl } from '@/components/ui/segmented-control';
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
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showBankImport, setShowBankImport] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState<{ ids: string[]; clear: () => void } | null>(null);
  const {
    data: transactions,
    isLoading,
    error,
    createTransaction,
    createTransactionsBulk,
    deleteTransaction,
    deleteTransactionsBulk,
    isDeleting,
  } = useTransactions({ page });
  const { hasFeature } = useEntitlements();

  function goToUpgrade() {
    toast.info('Native bank import is a Pro feature — start your free trial to unlock it.');
    router.push('/settings?tab=billing');
  }

  // Stagger-fade rows in only on the very first successful load — never on pagination or
  // refetch. Tracked as state, not a ref (refs can't be read during render), flipped via the
  // same render-time "adjusting state" pattern used on the portfolio page: this render's
  // shouldAnimateRows is computed first and used as-is, then setHasAnimated schedules the
  // flag for next render without this render ever re-reading it.
  const [hasAnimated, setHasAnimated] = useState(false);
  const shouldAnimateRows = !isLoading && !hasAnimated;
  if (shouldAnimateRows) {
    setHasAnimated(true);
  }

  const handleEdit = useCallback((transaction: Transaction) => setEditingTransaction(transaction), []);

  /** Every field `create`/`createTransactionsBulk` need to reconstruct a deleted row — shared
   * by the single- and bulk-delete undo paths below. */
  const toTransactionInput = useCallback(
    (t: Transaction) => ({
      date: t.date,
      type: t.type,
      amount: t.amount,
      from_account_id: t.from_account_id,
      category_id: t.category_id ?? undefined,
      sub_category: t.sub_category ?? undefined,
      to_account_id: t.to_account_id ?? undefined,
      notes: t.notes ?? undefined,
    }),
    []
  );

  /** Deletes one transaction and offers a 6-second "Undo" that re-creates it from the row's
   * own fields — a real recreate, not a soft-delete, since there's no `deleted_at` column to
   * restore from. */
  const handleDeleteWithUndo = useCallback(
    (t: Transaction) => {
      deleteTransaction(t.id);
      toast('Transaction deleted.', {
        duration: 6000,
        action: {
          label: 'Undo',
          onClick: () => {
            createTransaction(toTransactionInput(t)).catch(() => toast.error("Couldn't restore that transaction."));
          },
        },
      });
    },
    [deleteTransaction, createTransaction, toTransactionInput]
  );

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
            {hasFeature('bankStatementImport') ? (
              <Button variant="outline" onClick={() => setShowBankImport(true)}>
                <Landmark className="size-4" />
                Import from Bank
              </Button>
            ) : (
              <ProLockedButton
                label="Import from Bank"
                icon={<Landmark className="size-4" />}
                onUpgradeClick={goToUpgrade}
              />
            )}
            <Button onClick={() => setShowForm(true)}>
              <Plus className="size-4" />
              Add Transaction
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex justify-end">
        <SegmentedControl
          options={[
            { value: 'table', label: 'Table' },
            { value: 'calendar', label: 'Calendar' },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      {view === 'calendar' ? (
        <TransactionsCalendarView />
      ) : error ? (
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
              onClick={() => setPendingBulkDelete({ ids, clear })}
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
                aria-label="Edit transaction"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-8"
                onClick={() => setPendingDelete(t)}
                disabled={isDeleting}
                aria-label="Delete transaction"
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

      {showBankImport && <BankStatementImportDialog onClose={() => setShowBankImport(false)} />}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete transaction?"
        description="You can undo this for a few seconds after deleting."
        isConfirming={isDeleting}
        onConfirm={() => {
          if (pendingDelete) handleDeleteWithUndo(pendingDelete);
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={pendingBulkDelete !== null}
        onOpenChange={(open) => !open && setPendingBulkDelete(null)}
        title={`Delete ${pendingBulkDelete?.ids.length ?? 0} transaction${pendingBulkDelete?.ids.length === 1 ? '' : 's'}?`}
        description="This can't be undone."
        isConfirming={isDeleting}
        onConfirm={async () => {
          if (pendingBulkDelete) {
            const { ids, clear } = pendingBulkDelete;
            // Snapshot the full rows before they're gone — deleteTransactionsBulk only takes
            // ids, and by the time "Undo" is clicked the optimistic removal has already
            // dropped them from the cache.
            const deletedRows = (transactions ?? []).filter((t) => ids.includes(t.id));
            await deleteTransactionsBulk(ids);
            clear();
            toast(`${deletedRows.length} transaction${deletedRows.length === 1 ? '' : 's'} deleted.`, {
              duration: 6000,
              action: {
                label: 'Undo',
                onClick: () => {
                  createTransactionsBulk(deletedRows.map(toTransactionInput)).catch(() =>
                    toast.error("Couldn't restore those transactions.")
                  );
                },
              },
            });
          }
          setPendingBulkDelete(null);
        }}
      />
    </div>
  );
}
