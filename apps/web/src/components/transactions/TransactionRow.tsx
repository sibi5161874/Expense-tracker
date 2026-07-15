import { memo } from 'react';
import type { getTransactions } from '@repo/shared/queries/transactions';
import { TableCell, TableRow } from '@/components/ui/table';
import { AmountText } from '@/components/shared/AmountText';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { transactionTypeTone } from '@/lib/badgeTones';

type Transaction = NonNullable<Awaited<ReturnType<typeof getTransactions>>>[number];

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function TransactionRowComponent({ transaction, onEdit, onDelete, isDeleting }: TransactionRowProps) {
  const sign = transaction.type === 'Income' ? 'positive' : transaction.type === 'Expense' ? 'negative' : 'neutral';

  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{transaction.date}</TableCell>
      <TableCell>
        <StatusBadge tone={transactionTypeTone(transaction.type)}>{transaction.type}</StatusBadge>
      </TableCell>
      <TableCell>{transaction.category?.name ?? '-'}</TableCell>
      <TableCell className="text-right">
        <AmountText value={transaction.amount} sign={sign} />
      </TableCell>
      <TableCell>{transaction.from_account?.name ?? '-'}</TableCell>
      <TableCell className="text-muted-foreground max-w-48 truncate">{transaction.notes || '-'}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-8"
            onClick={() => onEdit(transaction)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            onClick={() => {
              if (confirm('Are you sure you want to delete this transaction?')) {
                onDelete(transaction.id);
              }
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

export const TransactionRow = memo(TransactionRowComponent);
