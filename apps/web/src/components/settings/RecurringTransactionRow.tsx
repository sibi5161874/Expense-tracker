import { memo } from 'react';
import { Pencil, Trash2, Pause, Play } from 'lucide-react';
import type { getRecurringTransactions } from '@repo/shared/queries/recurringTransactions';
import { formatINR } from '@repo/shared/utils/currency';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { transactionTypeTone } from '@/lib/badgeTones';

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
            onClick={() => {
              if (confirm('Delete this recurring transaction?')) onDelete(recurringTransaction.id);
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

export const RecurringTransactionRow = memo(RecurringTransactionRowComponent);
