'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { GoalForm } from '@/components/GoalForm';
import { GoalCard } from '@/components/goals/GoalCard';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import type { Goal } from '@repo/shared/types';

export default function GoalsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const { data: goals, isLoading, error, deleteGoal, isDeleting } = useGoals();

  const handleEdit = useCallback((goal: Goal) => setEditingGoal(goal), []);
  const handleDelete = useCallback((id: string) => deleteGoal(id), [deleteGoal]);
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingGoal(null);
  }, []);

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Track progress toward your savings goals."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            Add Goal
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading goals..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals?.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={handleEdit} onDelete={handleDelete} isDeleting={isDeleting} />
          ))}
          {goals?.length === 0 && (
            <div className="text-muted-foreground col-span-full rounded-2xl border border-dashed p-12 text-center">
              No goals found. Add your first goal to get started.
            </div>
          )}
        </div>
      )}

      {(showForm || editingGoal) && (
        <GoalForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingGoal
              ? {
                  id: editingGoal.id,
                  goal_name: editingGoal.goal_name,
                  category: editingGoal.category,
                  target_amount: editingGoal.target_amount,
                  saved_amount: editingGoal.saved_amount,
                  target_date: editingGoal.target_date,
                  priority: editingGoal.priority,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
