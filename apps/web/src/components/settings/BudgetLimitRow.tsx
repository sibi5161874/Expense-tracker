import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { getBudgetLimits } from '@repo/shared/queries/budgetLimits';
import { formatINR } from '@repo/shared/utils/currency';
import { calculateBudgetStatus } from '@repo/shared/logic';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { budgetStatusTone } from '@/lib/badgeTones';

type BudgetLimit = NonNullable<Awaited<ReturnType<typeof getBudgetLimits>>>[number];

interface BudgetLimitRowProps {
  budgetLimit: BudgetLimit;
  actualThisMonth: number;
  onEdit: (budgetLimit: BudgetLimit) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function BudgetLimitRowComponent({
  budgetLimit,
  actualThisMonth,
  onEdit,
  onDelete,
  isDeleting,
}: BudgetLimitRowProps) {
  const status = calculateBudgetStatus(actualThisMonth, budgetLimit.monthly_limit);

  return (
    <TableRow>
      <TableCell className="font-medium">{budgetLimit.category?.name ?? 'Unknown'}</TableCell>
      <TableCell className="text-right">{formatINR(budgetLimit.monthly_limit)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-muted-foreground font-mono text-xs tabular-nums">
            {formatINR(actualThisMonth)}
          </span>
          <StatusBadge tone={budgetStatusTone(status)}>{status}</StatusBadge>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-8"
            onClick={() => onEdit(budgetLimit)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            onClick={() => {
              if (confirm('Delete this budget limit?')) onDelete(budgetLimit.id);
            }}
            disabled={isDeleting}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export const BudgetLimitRow = memo(BudgetLimitRowComponent);
