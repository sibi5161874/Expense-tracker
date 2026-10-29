import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Goal } from '@repo/shared/types';
import { calculateProgressPct, calculateGoalStatus } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { goalStatusTone } from '@/lib/badgeTones';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { resolveGoalIcon } from '@/components/goals/goalIcons';
import { useTranslation } from '@/contexts/LocaleContext';

import { extractEmoji } from '@/components/GoalForm';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function GoalCardComponent({ goal, onEdit, onDelete, isDeleting }: GoalCardProps) {
  // Pre-migration goals stored an emoji as a goal_name prefix instead of the icon column.
  const { emoji: legacyEmoji, cleanText } = extractEmoji(goal.goal_name);
  const displayName = legacyEmoji ? cleanText || goal.goal_name : goal.goal_name;
  // resolveGoalIcon looks up a stable component reference from a fixed Map (never constructs
  // one) — the compiler's static-components check can't verify that, so it's disabled here.
  const Icon = legacyEmoji ? null : resolveGoalIcon(goal.icon);
  const progressPct = calculateProgressPct(goal.saved_amount, goal.target_amount);
  const status = calculateGoalStatus(goal.saved_amount, goal.target_amount, goal.target_date);
  const { t } = useTranslation();
  const { requestDelete, dialog } = useConfirmDelete(onDelete, t('confirm.deleteGoal.title'), t('common.cannotBeUndone'));

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-2xl text-xl shadow-inner ring-1 ring-border/50">
            {/* eslint-disable-next-line react-hooks/static-components -- Icon is a stable lookup from a fixed Map, not constructed per render */}
            {Icon ? <Icon className="size-5" /> : <span>{legacyEmoji}</span>}
          </div>
          <div>
            <h3 className="font-semibold">{displayName}</h3>
            <p className="text-muted-foreground text-xs">{goal.category}</p>
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
          onClick={() => requestDelete(goal.id)}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
      {dialog}
    </div>
  );
}

export const GoalCard = memo(GoalCardComponent);
