'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { useInvestmentLog } from '@/hooks/useInvestmentLog';
import { InvestmentForm } from '@/components/InvestmentForm';
import { InvestmentRow } from '@/components/investments/InvestmentRow';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import type { getInvestmentLog } from '@repo/shared/queries/investmentLog';

type InvestmentLogEntry = NonNullable<Awaited<ReturnType<typeof getInvestmentLog>>>[number];

export default function InvestmentsPage() {
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentLogEntry | null>(null);
  const { data: investments, isLoading, error, deleteInvestmentLog, isDeleting } = useInvestmentLog({ page });

  const handleEdit = useCallback((investment: InvestmentLogEntry) => setEditingInvestment(investment), []);
  const handleDelete = useCallback((id: string) => deleteInvestmentLog(id), [deleteInvestmentLog]);
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingInvestment(null);
  }, []);

  return (
    <div>
      <PageHeader
        title="Investment Log"
        description="Every buy, sell, SIP, dividend, bonus, and split event."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            Add Investment
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading investments..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <>
          <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments?.map((investment) => (
                  <InvestmentRow
                    key={investment.id}
                    investment={investment}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                  />
                ))}
                {investments?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground h-32 text-center">
                      No investments found. Add your first investment to get started.
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
              disabled={!investments || investments.length < 50}
            >
              Next
            </Button>
          </div>
        </>
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
    </div>
  );
}
