import { memo } from 'react';
import type { getInvestmentLog } from '@repo/shared/queries/investmentLog';
import { TableCell, TableRow } from '@/components/ui/table';
import { AmountText } from '@/components/shared/AmountText';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { investmentActionTone } from '@/lib/badgeTones';

type InvestmentLogEntry = NonNullable<Awaited<ReturnType<typeof getInvestmentLog>>>[number];

interface InvestmentRowProps {
  investment: InvestmentLogEntry;
  onEdit: (investment: InvestmentLogEntry) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function InvestmentRowComponent({ investment, onEdit, onDelete, isDeleting }: InvestmentRowProps) {
  const total = investment.quantity * investment.price + (investment.fees || 0);

  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{investment.date}</TableCell>
      <TableCell className="font-medium">{investment.symbol}</TableCell>
      <TableCell>
        <StatusBadge tone={investmentActionTone(investment.action)}>{investment.action}</StatusBadge>
      </TableCell>
      <TableCell className="text-right tabular-nums">{investment.quantity}</TableCell>
      <TableCell className="text-right">
        <AmountText value={investment.price} colorBySign={false} />
      </TableCell>
      <TableCell className="text-right">
        <AmountText value={total} colorBySign={false} />
      </TableCell>
      <TableCell>{investment.linked_account?.name ?? '-'}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-8"
            onClick={() => onEdit(investment)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            onClick={() => {
              if (confirm('Are you sure you want to delete this investment?')) {
                onDelete(investment.id);
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

export const InvestmentRow = memo(InvestmentRowComponent);
