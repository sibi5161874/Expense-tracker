'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Download, UploadCloud, Landmark, Pencil, Trash2 } from 'lucide-react';
import { useInvestmentLog } from '@/hooks/useInvestmentLog';
import { useEntitlements } from '@/hooks/useEntitlements';
import { InvestmentForm } from '@/components/InvestmentForm';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { BrokerImportDialog } from '@/components/shared/BrokerImportDialog';
import { ProLockedButton } from '@/components/shared/ProGate';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable, type DataTableColumn, type DataTableFilter } from '@/components/shared/DataTable';
import { InvestmentLogCalendarView } from '@/components/investments/InvestmentLogCalendarView';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { AmountText } from '@/components/shared/AmountText';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/QueryState';
import { investmentActionTone } from '@/lib/badgeTones';
import { downloadCsvTemplate } from '@/lib/downloadCsvTemplate';
import { INVESTMENT_LOG_TEMPLATE_COLUMNS, INVESTMENT_LOG_TEMPLATE_EXAMPLE_ROW } from '@repo/shared';
import type { getInvestmentLog } from '@repo/shared/queries/investmentLog';

type InvestmentLogEntry = NonNullable<Awaited<ReturnType<typeof getInvestmentLog>>>[number];

const ACTIONS = ['BUY', 'SELL', 'SIP', 'DIVIDEND', 'BONUS', 'SPLIT'];

export default function InvestmentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showBrokerImport, setShowBrokerImport] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentLogEntry | null>(null);
  const {
    data: investments,
    isLoading,
    error,
    totalCount,
    createInvestmentLog,
    createInvestmentLogsBulk,
    deleteInvestmentLog,
    deleteInvestmentLogBulk,
    isDeleting,
  } = useInvestmentLog({ page, pageSize });
  const { hasFeature } = useEntitlements();

  function goToUpgrade() {
    toast.info('Native broker import is a Pro feature — start your free trial to unlock it.');
    router.push('/settings?tab=billing');
  }

  const [pendingBulkDelete, setPendingBulkDelete] = useState<{ ids: string[]; clear: () => void } | null>(null);
  const handleEdit = useCallback((investment: InvestmentLogEntry) => setEditingInvestment(investment), []);

  /** Every field `createInvestmentLog`/`createInvestmentLogsBulk` need to reconstruct a
   * deleted row — shared by the single- and bulk-delete undo paths below. */
  const toInvestmentLogInput = useCallback(
    (investment: InvestmentLogEntry) => ({
      date: investment.date,
      symbol: investment.symbol,
      exchange: investment.exchange,
      action: investment.action,
      quantity: investment.quantity,
      price: investment.price,
      fees: investment.fees,
      bonus_split_extra_units: investment.bonus_split_extra_units ?? undefined,
      linked_account_id: investment.linked_account_id,
      asset_type: investment.asset_type,
      notes: investment.notes ?? undefined,
    }),
    []
  );

  /** Deletes one investment and offers a 6-second "Undo" that re-creates it from its own
   * fields — a real recreate, not a soft-delete, matching the transactions page pattern. */
  const handleDeleteWithUndo = useCallback(
    (investment: InvestmentLogEntry) => {
      deleteInvestmentLog(investment.id);
      toast('Investment deleted.', {
        duration: 6000,
        action: {
          label: 'Undo',
          onClick: () => {
            createInvestmentLog(toInvestmentLogInput(investment)).catch(() =>
              toast.error("Couldn't restore that investment.")
            );
          },
        },
      });
    },
    [deleteInvestmentLog, createInvestmentLog, toInvestmentLogInput]
  );

  const { requestDelete, dialog } = useConfirmDelete(
    (id: string) => {
      const investment = investments?.find((i) => i.id === id);
      if (investment) handleDeleteWithUndo(investment);
    },
    'Delete investment?',
    'You can undo this for a few seconds after deleting.'
  );
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingInvestment(null);
  }, []);

  const columns: DataTableColumn<InvestmentLogEntry>[] = [
    { id: 'date', header: 'Date', cell: (i) => <span className="text-muted-foreground">{i.date}</span>, sortValue: (i) => i.date },
    { id: 'symbol', header: 'Symbol', cell: (i) => <span className="font-medium">{i.symbol}</span> },
    { id: 'action', header: 'Action', cell: (i) => <StatusBadge tone={investmentActionTone(i.action)}>{i.action}</StatusBadge> },
    {
      id: 'quantity',
      header: 'Quantity',
      className: 'text-right tabular-nums',
      cell: (i) => i.quantity,
      sortValue: (i) => i.quantity,
    },
    {
      id: 'price',
      header: 'Price',
      className: 'text-right',
      cell: (i) => <AmountText value={i.price} colorBySign={false} />,
      sortValue: (i) => i.price,
    },
    {
      id: 'total',
      header: 'Total',
      className: 'text-right',
      cell: (i) => <AmountText value={i.quantity * i.price + (i.fees || 0)} colorBySign={false} />,
      sortValue: (i) => i.quantity * i.price + (i.fees || 0),
    },
    { id: 'account', header: 'Account', cell: (i) => i.linked_account?.name ?? '-' },
  ];

  const filters: DataTableFilter<InvestmentLogEntry>[] = [
    { id: 'action', label: 'Action', options: ACTIONS.map((a) => ({ label: a, value: a })), getValue: (i) => i.action },
  ];

  return (
    <div>
      <PageHeader
        title="Investment Log"
        description="Every buy, sell, SIP, dividend, bonus, and split event."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsvTemplate(
                  'investment-log-template.csv',
                  INVESTMENT_LOG_TEMPLATE_COLUMNS,
                  INVESTMENT_LOG_TEMPLATE_EXAMPLE_ROW
                )
              }
            >
              <Download className="size-4" />
              Download Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <UploadCloud className="size-4" />
              Import CSV
            </Button>
            {hasFeature('brokerImport') ? (
              <Button variant="outline" size="sm" onClick={() => setShowBrokerImport(true)}>
                <Landmark className="size-4" />
                Import from Broker
              </Button>
            ) : (
              <ProLockedButton
                label="Import from Broker"
                icon={<Landmark className="size-4" />}
                onUpgradeClick={goToUpgrade}
                size="sm"
              />
            )}
            <Button onClick={() => setShowForm(true)}>
              <Plus className="size-4" />
              Add Investment
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
        <InvestmentLogCalendarView />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <DataTable
          data={investments}
          isLoading={isLoading}
          columns={columns}
          getRowId={(i) => i.id}
          searchPlaceholder="Search symbol, account…"
          searchableText={(i) => `${i.symbol} ${i.linked_account?.name ?? ''}`}
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
          rowActions={(i) => (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground size-8"
                onClick={() => handleEdit(i)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-8"
                onClick={() => requestDelete(i.id)}
                disabled={isDeleting}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}
          emptyMessage="No investments found. Add your first investment to get started."
          page={page}
          onPageChange={setPage}
          hasNextPage={!!investments && investments.length >= pageSize}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
        />
      )}

      {(showForm || editingInvestment) && (
        <InvestmentForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingInvestment
              ? {
                  id: editingInvestment.id,
                  date: editingInvestment.date,
                  symbol: editingInvestment.symbol,
                  exchange: editingInvestment.exchange,
                  action: editingInvestment.action,
                  quantity: editingInvestment.quantity,
                  price: editingInvestment.price,
                  fees: editingInvestment.fees,
                  bonus_split_extra_units: editingInvestment.bonus_split_extra_units ?? undefined,
                  linked_account_id: editingInvestment.linked_account_id,
                  asset_type: editingInvestment.asset_type,
                  notes: editingInvestment.notes ?? undefined,
                }
              : undefined
          }
        />
      )}

      {showImport && (
        <ImportDialog
          apiPath="/api/import/investment-log"
          entityLabel="investment log"
          invalidateQueryKeys={[['investmentLog'], ['allInvestmentLog'], ['holdings']]}
          onClose={() => setShowImport(false)}
        />
      )}

      {showBrokerImport && <BrokerImportDialog onClose={() => setShowBrokerImport(false)} />}

      {dialog}
      <ConfirmDialog
        open={pendingBulkDelete !== null}
        onOpenChange={(open) => !open && setPendingBulkDelete(null)}
        title={`Delete ${pendingBulkDelete?.ids.length ?? 0} investment${pendingBulkDelete?.ids.length === 1 ? '' : 's'}?`}
        description="This can't be undone."
        isConfirming={isDeleting}
        onConfirm={async () => {
          if (pendingBulkDelete) {
            const { ids, clear } = pendingBulkDelete;
            const deletedRows = (investments ?? []).filter((i) => ids.includes(i.id));
            await deleteInvestmentLogBulk(ids);
            clear();
            toast(`${deletedRows.length} investment${deletedRows.length === 1 ? '' : 's'} deleted.`, {
              duration: 6000,
              action: {
                label: 'Undo',
                onClick: () => {
                  createInvestmentLogsBulk(deletedRows.map(toInvestmentLogInput)).catch(() =>
                    toast.error("Couldn't restore those investments.")
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
