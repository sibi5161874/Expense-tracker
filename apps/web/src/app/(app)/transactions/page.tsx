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
import { DataTable, type DataTableColumn, type DataTableFilter, type SortDirection } from '@/components/shared/DataTable';
import { TransactionsCalendarView } from '@/components/transactions/TransactionsCalendarView';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Button } from '@/components/ui/button';
import { AmountText } from '@/components/shared/AmountText';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/QueryState';
import { EmptyState } from '@/components/shared/EmptyState';
import { AdBanner } from '@/components/shared/AdBanner';
import { transactionTypeTone } from '@/lib/badgeTones';
import { downloadCsvTemplate } from '@/lib/downloadCsvTemplate';
import { useTranslation } from '@/contexts/LocaleContext';
import { TRANSACTIONS_TEMPLATE_COLUMNS, TRANSACTIONS_TEMPLATE_EXAMPLE_ROW } from '@repo/shared';
import type { getTransactions } from '@repo/shared/queries/transactions';

type Transaction = NonNullable<Awaited<ReturnType<typeof getTransactions>>>[number];

export default function TransactionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sort, setSort] = useState<{ columnId: string; direction: SortDirection } | null>(null);
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [showForm, setShowForm] = useState(false);
  // Issue #19: see the matching comment in investments/page.tsx — a single union in place of
  // two independent booleans guarantees the CSV and bank-statement import dialogs can never
  // both be mounted (and their Radix overlays stacked) at once.
  const [activeImportModal, setActiveImportModal] = useState<'csv' | 'bank' | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState<{ ids: string[]; clear: () => void } | null>(null);
  const {
    data: transactions,
    isLoading,
    error,
    totalCount,
    createTransaction,
    createTransactionsBulk,
    deleteTransaction,
    deleteTransactionsBulk,
    isDeleting,
  } = useTransactions({
    page,
    pageSize,
    search: search || undefined,
    type: typeFilter ? (typeFilter as 'Income' | 'Expense' | 'Transfer') : undefined,
    sortBy: sort ? (sort.columnId as 'date' | 'amount') : undefined,
    sortAscending: sort ? sort.direction === 'asc' : undefined,
  });
  const { hasFeature } = useEntitlements();
  const { t: translate } = useTranslation();

  function goToUpgrade() {
    toast.info('Native bank import is a Pro feature — start your free trial to unlock it.');
    router.push('/settings?tab=billing');
  }

  const [hasAnimated, setHasAnimated] = useState(false);
  const shouldAnimateRows = !isLoading && !hasAnimated;
  if (shouldAnimateRows) {
    setHasAnimated(true);
  }

  const handleEdit = useCallback((transaction: Transaction) => setEditingTransaction(transaction), []);

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

  const handleDeleteWithUndo = useCallback(
    (t: Transaction) => {
      deleteTransaction(t.id);
      toast(translate('toast.transaction.deleted'), {
        duration: 6000,
        action: {
          label: translate('common.undo'),
          onClick: () => {
            createTransaction(toTransactionInput(t)).catch(() => toast.error(translate('toast.transaction.restoreFailed')));
          },
        },
      });
    },
    [deleteTransaction, createTransaction, toTransactionInput, translate]
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
      cell: (t) => <AmountText value={t.amount} sign={t.type === 'Income' ? 'positive' : t.type === 'Expense' ? 'negative' : 'neutral'} />,
      sortValue: (t) => t.amount,
    },
    {
      id: 'account',
      header: 'Account',
      cell: (t) =>
        t.type === 'Transfer'
          ? `${t.from_account?.name ?? '-'} → ${t.to_account?.name ?? '-'}`
          : (t.from_account?.name ?? '-'),
    },
    {
      id: 'notes',
      header: 'Notes',
      cell: (t) => (
        <span className="text-muted-foreground block max-w-xs truncate text-xs">
          {t.notes || t.sub_category || '-'}
        </span>
      ),
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
      {/* Mobile Top Header + Action Bar (< md:) */}
      <div className="mb-4 space-y-3 md:hidden">
        {/* Row 1: Title & View Segmented Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground text-xs">Track income, expenses & transfers</p>
          </div>
          <SegmentedControl
            options={[
              { value: 'table', label: 'Table' },
              { value: 'calendar', label: 'Calendar' },
            ]}
            value={view}
            onChange={setView}
            className="shrink-0"
          />
        </div>

        {/* Row 2: Add Transaction Primary + Compact Icon Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowForm(true)}
            className="flex-1 h-10 rounded-xl font-medium shadow-xs"
          >
            <Plus className="size-4 mr-1.5" />
            Add Transaction
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-xl"
            onClick={() => setActiveImportModal('csv')}
            title="Import CSV"
            aria-label="Import CSV"
          >
            <UploadCloud className="size-4" />
          </Button>
          {hasFeature('bankStatementImport') ? (
            <Button
              variant="outline"
              size="icon"
              className="size-10 shrink-0 rounded-xl"
              onClick={() => setActiveImportModal('bank')}
              title="Import from Bank"
              aria-label="Import from Bank"
            >
              <Landmark className="size-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="size-10 shrink-0 rounded-xl text-muted-foreground"
              onClick={goToUpgrade}
              title="Import from Bank (Pro)"
              aria-label="Import from Bank (Pro)"
            >
              <Landmark className="size-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-xl"
            onClick={() =>
              downloadCsvTemplate(
                'transactions-template.csv',
                TRANSACTIONS_TEMPLATE_COLUMNS,
                TRANSACTIONS_TEMPLATE_EXAMPLE_ROW
              )
            }
            title="Download CSV Template"
            aria-label="Download CSV Template"
          >
            <Download className="size-4" />
          </Button>
        </div>
      </div>

      {/* Desktop Header & View Toggle (>= md:) */}
      <div className="hidden md:block">
        <PageHeader
          title="Transactions"
          description="Track your income, expenses, and transfers."
          action={
            <div className="flex flex-wrap items-center gap-2">
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
              <Button variant="outline" onClick={() => setActiveImportModal('csv')}>
                <UploadCloud className="size-4" />
                Import CSV
              </Button>
              {hasFeature('bankStatementImport') ? (
                <Button variant="outline" onClick={() => setActiveImportModal('bank')}>
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
      </div>

      {view === 'calendar' ? (
        <TransactionsCalendarView />
      ) : error ? (
        <ErrorState error={error} />
      ) : !isLoading && transactions?.length === 0 && page === 0 && !search && !typeFilter ? (
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
        <>
        <DataTable
          data={transactions}
          isLoading={isLoading}
          columns={columns}
          getRowId={(t) => t.id}
          searchPlaceholder="Search category, account, notes…"
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(0);
          }}
          filters={filters}
          filterValues={{ type: typeFilter }}
          onFilterChange={(_filterId, value) => {
            setTypeFilter(value);
            setPage(0);
          }}
          sort={sort}
          onSortChange={(next) => {
            setSort(next);
            setPage(0);
          }}
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
                aria-label={translate('aria.deleteTransaction')}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}
          emptyMessage="No transactions on this page."
          page={page}
          onPageChange={setPage}
          hasNextPage={!!transactions && transactions.length >= pageSize}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
          animateRows={shouldAnimateRows}
        />
        <div className="mt-8">
          <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LIST} />
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

      {activeImportModal === 'csv' && (
        <ImportDialog
          apiPath="/api/import/transactions"
          entityLabel="transaction"
          invalidateQueryKeys={[['transactions'], ['monthlyOverview']]}
          onClose={() => setActiveImportModal(null)}
          onDownloadTemplate={() =>
            downloadCsvTemplate('transactions-template.csv', TRANSACTIONS_TEMPLATE_COLUMNS, TRANSACTIONS_TEMPLATE_EXAMPLE_ROW)
          }
        />
      )}

      {activeImportModal === 'bank' && (
        <BankStatementImportDialog onClose={() => setActiveImportModal(null)} />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={translate('confirm.deleteTransaction.title')}
        description={translate('common.undoableForSeconds')}
        isConfirming={isDeleting}
        onConfirm={() => {
          if (pendingDelete) handleDeleteWithUndo(pendingDelete);
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={pendingBulkDelete !== null}
        onOpenChange={(open) => !open && setPendingBulkDelete(null)}
        title={translate('confirm.deleteTransactionsCount.title', { count: pendingBulkDelete?.ids.length ?? 0 })}
        description={translate('common.cannotBeUndone')}
        isConfirming={isDeleting}
        onConfirm={async () => {
          if (pendingBulkDelete) {
            const { ids, clear } = pendingBulkDelete;
            const deletedRows = (transactions ?? []).filter((t) => ids.includes(t.id));
            await deleteTransactionsBulk(ids);
            clear();
            toast(translate('toast.transactionsCount.deleted', { count: deletedRows.length }), {
              duration: 6000,
              action: {
                label: translate('common.undo'),
                onClick: () => {
                  createTransactionsBulk(deletedRows.map(toTransactionInput)).catch(() =>
                    toast.error(translate('toast.transactions.restoreFailed'))
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
