'use client';

import { useCallback, useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { GoalForm } from '@/components/GoalForm';
import { GoalCard } from '@/components/goals/GoalCard';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
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
          <Button onClick={() => setShowForm(true)} className="min-h-[44px]">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals?.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={handleEdit} onDelete={handleDelete} isDeleting={isDeleting} />
          ))}
          {goals?.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={Target}
                title="Add your first goal"
                subtitle="Goals help you track progress toward what matters most."
                adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_EMPTY}
                action={
                  <Button onClick={() => setShowForm(true)} className="min-h-[44px]">
                    <Plus className="size-4" />
                    Create Goal
                  </Button>
                }
              />
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
                  target_amount: editingGoal.target_amount,
                  target_date: editingGoal.target_date,
                  category: editingGoal.category,
                  priority: editingGoal.priority,
                  saved_amount: editingGoal.saved_amount,
                  icon: editingGoal.icon,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
