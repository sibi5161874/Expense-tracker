'use client';

import { useGoals } from '@/hooks/useGoals';
import { calculateProgressPct, calculateGoalStatus } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { DataTable, type DataTableColumn, type DataTableFilter } from '@/components/shared/DataTable';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import { goalStatusTone } from '@/lib/badgeTones';
import type { Goal } from '@repo/shared/types';

export function GoalProgressReport() {
  const { data: goals, isLoading, error } = useGoals();

  if (isLoading) return <LoadingState label="Loading report..." />;
  if (error) return <ErrorState error={error} />;

  const columns: DataTableColumn<Goal>[] = [
    { id: 'goal', header: 'Goal', cell: (g) => <span className="font-medium">{g.goal_name}</span> },
    { id: 'saved', header: 'Saved', className: 'text-right', cell: (g) => formatINR(g.saved_amount), sortValue: (g) => g.saved_amount },
    { id: 'target', header: 'Target', className: 'text-right', cell: (g) => formatINR(g.target_amount), sortValue: (g) => g.target_amount },
    { id: 'targetDate', header: 'Target Date', cell: (g) => g.target_date, sortValue: (g) => g.target_date },
    {
      id: 'status',
      header: 'Status',
      cell: (g) => {
        const status = calculateGoalStatus(g.saved_amount, g.target_amount, g.target_date);
        return <StatusBadge tone={goalStatusTone(status)}>{status}</StatusBadge>;
      },
    },
  ];

  const goalStatuses = Array.from(
    new Set((goals ?? []).map((g) => calculateGoalStatus(g.saved_amount, g.target_amount, g.target_date)))
  );
  const filters: DataTableFilter<Goal>[] = [
    {
      id: 'status',
      label: 'Status',
      options: goalStatuses.map((s) => ({ label: s, value: s })),
      getValue: (g) => calculateGoalStatus(g.saved_amount, g.target_amount, g.target_date),
    },
  ];

  return (
    <ReportContainer
      title="Goal Progress"
      description="Saved vs target for every goal."
      excelSheets={[
        {
          name: 'Goal Progress',
          rows: (goals ?? []).map((g) => ({
            Goal: g.goal_name,
            Category: g.category,
            Saved: g.saved_amount,
            Target: g.target_amount,
            'Progress %': Number((calculateProgressPct(g.saved_amount, g.target_amount) * 100).toFixed(1)),
            'Target Date': g.target_date,
            Status: calculateGoalStatus(g.saved_amount, g.target_amount, g.target_date),
          })),
        },
      ]}
    >
      <div className="space-y-4">
        {goals?.map((g) => {
          const progressPct = calculateProgressPct(g.saved_amount, g.target_amount);
          const status = calculateGoalStatus(g.saved_amount, g.target_amount, g.target_date);
          return (
            <div key={g.id} className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{g.goal_name}</h3>
                <StatusBadge tone={goalStatusTone(status)}>{status}</StatusBadge>
              </div>
              <Progress value={Math.min(progressPct * 100, 100)} />
              <div className="text-muted-foreground mt-2 flex justify-between text-sm">
                <span>{formatINR(g.saved_amount)} saved</span>
                <span>{formatINR(g.target_amount)} target</span>
              </div>
            </div>
          );
        })}
        {(!goals || goals.length === 0) && (
          <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center">
            No goals found. Add your first goal to get started.
          </div>
        )}
      </div>

      <DataTable
        data={goals}
        columns={columns}
        getRowId={(g) => g.id}
        searchPlaceholder="Search goal…"
        searchableText={(g) => g.goal_name}
        filters={filters}
        emptyMessage="No goals found."
      />
    </ReportContainer>
  );
}
