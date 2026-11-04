import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { getBudgetLimits } from '@repo/shared/queries/budgetLimits';
import { formatINR } from '@repo/shared/utils/currency';
import { calculateBudgetStatus } from '@repo/shared/logic';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { budgetStatusTone } from '@/lib/badgeTones';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useTranslation } from '@/contexts/LocaleContext';

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
  const { t } = useTranslation();
  const { requestDelete, dialog } = useConfirmDelete(onDelete, t('confirm.deleteBudgetLimit.title'), t('common.cannotBeUndone'));

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
            onClick={() => requestDelete(budgetLimit.id)}
            disabled={isDeleting}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
      {dialog}
    </TableRow>
  );
}

export const BudgetLimitRow = memo(BudgetLimitRowComponent);

/** Mobile counterpart to BudgetLimitRow — same data/logic, rendered as a card instead of a
 * `<TableRow>` so it can be used outside a `<Table>` below `md:`. */
function BudgetLimitCardComponent({ budgetLimit, actualThisMonth, onEdit, onDelete, isDeleting }: BudgetLimitRowProps) {
  const status = calculateBudgetStatus(actualThisMonth, budgetLimit.monthly_limit);
  const { t } = useTranslation();
  const { requestDelete, dialog } = useConfirmDelete(onDelete, t('confirm.deleteBudgetLimit.title'), t('common.cannotBeUndone'));

  return (
    <div className="bg-card flex items-center justify-between gap-2 rounded-2xl border border-border/60 p-4">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="font-medium">{budgetLimit.category?.name ?? 'Unknown'}</div>
        <div className="text-muted-foreground text-xs">Limit {formatINR(budgetLimit.monthly_limit)}</div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono text-xs tabular-nums">{formatINR(actualThisMonth)} this month</span>
          <StatusBadge tone={budgetStatusTone(status)}>{status}</StatusBadge>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
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
          onClick={() => requestDelete(budgetLimit.id)}
          disabled={isDeleting}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {dialog}
    </div>
  );
}

export const BudgetLimitCard = memo(BudgetLimitCardComponent);
