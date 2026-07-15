import { memo } from 'react';
import { Pencil, Target, Trash2 } from 'lucide-react';
import type { Goal } from '@repo/shared/types';
import { calculateProgressPct, calculateGoalStatus } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { goalStatusTone } from '@/lib/badgeTones';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function GoalCardComponent({ goal, onEdit, onDelete, isDeleting }: GoalCardProps) {
  const progressPct = calculateProgressPct(goal.saved_amount, goal.target_amount);
  const status = calculateGoalStatus(goal.saved_amount, goal.target_amount, goal.target_date);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
            <Target className="size-4.5" />
          </div>
          <div>
            <h3 className="font-semibold">{goal.goal_name}</h3>
            <p className="text-muted-foreground text-sm">{goal.category}</p>
          </div>
        </div>
        <StatusBadge tone={goalStatusTone(status)}>{status}</StatusBadge>
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium tabular-nums">{(progressPct * 100).toFixed(1)}%</span>
        </div>
        <Progress value={Math.min(progressPct * 100, 100)} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Saved</p>
          <p className="font-medium tabular-nums">{formatINR(goal.saved_amount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Target</p>
          <p className="font-medium tabular-nums">{formatINR(goal.target_amount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Target Date</p>
          <p className="font-medium">{goal.target_date}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Priority</p>
          <p className="font-medium">{goal.priority}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(goal)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          disabled={isDeleting}
          onClick={() => {
            if (confirm('Are you sure you want to delete this goal?')) {
              onDelete(goal.id);
            }
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const GoalCard = memo(GoalCardComponent);
