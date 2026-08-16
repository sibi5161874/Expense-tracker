'use client';

import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useBudgetLimits } from '@/hooks/useBudgetLimits';
import { useMonthlyOverview } from '@/hooks/useTransactions';
import { formatMonth } from '@repo/shared/utils';
import { BudgetLimitForm } from '@/components/BudgetLimitForm';
import { BudgetLimitRow } from '@/components/settings/BudgetLimitRow';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import type { getBudgetLimits } from '@repo/shared/queries/budgetLimits';

type BudgetLimit = NonNullable<Awaited<ReturnType<typeof getBudgetLimits>>>[number];

export function BudgetsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetLimit | null>(null);
  const { data: budgetLimits, isLoading, error, deleteBudgetLimit, isDeleting } = useBudgetLimits();

  const currentMonth = formatMonth(new Date());
  const { data: monthTransactions } = useMonthlyOverview(currentMonth);
  const actualByCategoryId = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const txn of monthTransactions ?? []) {
      if (txn.type !== 'Expense' || !txn.category_id) continue;
      totals[txn.category_id] = (totals[txn.category_id] ?? 0) + txn.amount;
    }
    return totals;
  }, [monthTransactions]);

  const handleDelete = useCallback((id: string) => deleteBudgetLimit(id), [deleteBudgetLimit]);
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingBudget(null);
  }, []);

  if (isLoading) return <LoadingState label="Loading budget limits..." />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4" />
          Add Budget Limit
        </Button>
      </div>

      <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Monthly Limit</TableHead>
              <TableHead className="text-right">This Month</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgetLimits?.map((budgetLimit) => (
              <BudgetLimitRow
                key={budgetLimit.id}
                budgetLimit={budgetLimit}
                actualThisMonth={actualByCategoryId[budgetLimit.category_id] ?? 0}
                onEdit={setEditingBudget}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            ))}
            {budgetLimits?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground h-32 text-center">
                  No budget limits set. Add one to see Budget vs Actual on your reports.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(showForm || editingBudget) && (
        <BudgetLimitForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingBudget
              ? { id: editingBudget.id, category_id: editingBudget.category_id, monthly_limit: editingBudget.monthly_limit }
              : undefined
          }
        />
      )}
    </div>
  );
}
