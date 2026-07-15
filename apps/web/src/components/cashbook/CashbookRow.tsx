import { memo } from 'react';
import type { getCashbook } from '@repo/shared/queries/cashbook';
import { TableCell, TableRow } from '@/components/ui/table';
import { AmountText } from '@/components/shared/AmountText';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { cashbookFlowTone } from '@/lib/badgeTones';

type CashbookEntry = NonNullable<Awaited<ReturnType<typeof getCashbook>>>[number];

interface CashbookRowProps {
  entry: CashbookEntry;
  onEdit: (entry: CashbookEntry) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function CashbookRowComponent({ entry, onEdit, onDelete, isDeleting }: CashbookRowProps) {
  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{entry.date}</TableCell>
      <TableCell className="font-medium">{entry.counterparty}</TableCell>
      <TableCell>
        <StatusBadge tone={cashbookFlowTone(entry.flow)}>{entry.flow}</StatusBadge>
      </TableCell>
      <TableCell className="text-right">
        <AmountText value={entry.amount} colorBySign={false} />
      </TableCell>
      <TableCell className="text-muted-foreground">{entry.due_date || '-'}</TableCell>
      <TableCell>{entry.account_used?.name ?? '-'}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-8"
            onClick={() => onEdit(entry)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            onClick={() => {
              if (confirm('Are you sure you want to delete this entry?')) {
                onDelete(entry.id);
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

export const CashbookRow = memo(CashbookRowComponent);
