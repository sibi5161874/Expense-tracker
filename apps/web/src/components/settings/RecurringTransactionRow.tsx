import { memo } from 'react';
import { Pencil, Trash2, Pause, Play } from 'lucide-react';
import type { getRecurringTransactions } from '@repo/shared/queries/recurringTransactions';
import { formatINR } from '@repo/shared/utils/currency';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { transactionTypeTone } from '@/lib/badgeTones';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useTranslation } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

type RecurringTransaction = NonNullable<Awaited<ReturnType<typeof getRecurringTransactions>>>[number];

interface RecurringTransactionRowProps {
  recurringTransaction: RecurringTransaction;
  onEdit: (recurringTransaction: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onToggleActive: (recurringTransaction: RecurringTransaction) => void;
  isDeleting: boolean;
}

function RecurringTransactionRowComponent({
  recurringTransaction,
  onEdit,
  onDelete,
  onToggleActive,
  isDeleting,
}: RecurringTransactionRowProps) {
  const { t } = useTranslation();
  const { requestDelete, dialog } = useConfirmDelete(
    onDelete,
    t('confirm.deleteRecurringTransaction.title'),
    t('common.cannotBeUndone')
  );
  const label = recurringTransaction.notes || recurringTransaction.category?.name || 'Untitled';
  const nextRun = new Date(recurringTransaction.next_run_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <TableRow className={recurringTransaction.is_active ? undefined : 'opacity-60'}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {label}
          <StatusBadge tone={transactionTypeTone(recurringTransaction.type)}>{recurringTransaction.type}</StatusBadge>
        </div>
      </TableCell>
      <TableCell className="text-right">{formatINR(recurringTransaction.amount)}</TableCell>
      <TableCell>{recurringTransaction.frequency}</TableCell>
      <TableCell>{recurringTransaction.is_active ? `Next: ${nextRun}` : 'Paused'}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-8"
            onClick={() => onToggleActive(recurringTransaction)}
            title={recurringTransaction.is_active ? 'Pause' : 'Resume'}
          >
            {recurringTransaction.is_active ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-8"
            onClick={() => onEdit(recurringTransaction)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            onClick={() => requestDelete(recurringTransaction.id)}
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

export const RecurringTransactionRow = memo(RecurringTransactionRowComponent);

/** Mobile counterpart to RecurringTransactionRow — same data/logic, rendered as a card instead
 * of a `<TableRow>` so it can be used outside a `<Table>` below `md:`. */
function RecurringTransactionCardComponent({
  recurringTransaction,
  onEdit,
  onDelete,
  onToggleActive,
  isDeleting,
}: RecurringTransactionRowProps) {
  const { t } = useTranslation();
  const { requestDelete, dialog } = useConfirmDelete(
    onDelete,
    t('confirm.deleteRecurringTransaction.title'),
    t('common.cannotBeUndone')
  );
  const label = recurringTransaction.notes || recurringTransaction.category?.name || 'Untitled';
  const nextRun = new Date(recurringTransaction.next_run_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={cn(
        'bg-card space-y-2 rounded-2xl border border-border/60 p-4',
        !recurringTransaction.is_active && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-medium">
            <span className="truncate">{label}</span>
            <StatusBadge tone={transactionTypeTone(recurringTransaction.type)}>{recurringTransaction.type}</StatusBadge>
          </div>
          <div className="text-muted-foreground text-xs">
            {recurringTransaction.frequency} · {recurringTransaction.is_active ? `Next: ${nextRun}` : 'Paused'}
          </div>
        </div>
        <div className="shrink-0 font-medium">{formatINR(recurringTransaction.amount)}</div>
      </div>
      <div className="flex justify-end gap-1 border-t border-border/60 pt-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-8"
          onClick={() => onToggleActive(recurringTransaction)}
          title={recurringTransaction.is_active ? 'Pause' : 'Resume'}
        >
          {recurringTransaction.is_active ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-8"
          onClick={() => onEdit(recurringTransaction)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-8"
          onClick={() => requestDelete(recurringTransaction.id)}
          disabled={isDeleting}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {dialog}
    </div>
  );
}

export const RecurringTransactionCard = memo(RecurringTransactionCardComponent);
