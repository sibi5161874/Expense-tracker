'use client';

import { useCallback, useState } from 'react';
import { Plus, Download, UploadCloud, Pencil, Trash2 } from 'lucide-react';
import { useInvestmentLog } from '@/hooks/useInvestmentLog';
import { InvestmentForm } from '@/components/InvestmentForm';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { DataTable, type DataTableColumn, type DataTableFilter } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
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
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentLogEntry | null>(null);
  const { data: investments, isLoading, error, deleteInvestmentLog, isDeleting } = useInvestmentLog({ page });

  const handleEdit = useCallback((investment: InvestmentLogEntry) => setEditingInvestment(investment), []);
  const handleDelete = useCallback((id: string) => deleteInvestmentLog(id), [deleteInvestmentLog]);
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
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <UploadCloud className="size-4" />
              Import CSV
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="size-4" />
              Add Investment
            </Button>
          </div>
        }
      />

      {error ? (
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
              onClick={() => {
                if (confirm(`Delete ${ids.length} investment${ids.length === 1 ? '' : 's'}?`)) {
                  ids.forEach((id) => handleDelete(id));
                  clear();
                }
              }}
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
                onClick={() => {
                  if (confirm('Are you sure you want to delete this investment?')) handleDelete(i.id);
                }}
                disabled={isDeleting}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}
          emptyMessage="No investments found. Add your first investment to get started."
          page={page}
          onPageChange={setPage}
          hasNextPage={!!investments && investments.length >= 50}
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
    </div>
  );
}
