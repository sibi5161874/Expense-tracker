import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { getBudgetLimits } from '@repo/shared/queries/budgetLimits';
import { formatINR } from '@repo/shared/utils/currency';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

type BudgetLimit = NonNullable<Awaited<ReturnType<typeof getBudgetLimits>>>[number];

interface BudgetLimitRowProps {
  budgetLimit: BudgetLimit;
  onEdit: (budgetLimit: BudgetLimit) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function BudgetLimitRowComponent({ budgetLimit, onEdit, onDelete, isDeleting }: BudgetLimitRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{budgetLimit.category?.name ?? 'Unknown'}</TableCell>
      <TableCell className="text-right">{formatINR(budgetLimit.monthly_limit)}</TableCell>
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
