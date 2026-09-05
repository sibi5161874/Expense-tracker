import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Category } from '@repo/shared/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { transactionTypeTone } from '@/lib/badgeTones';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';

interface CategoryRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function CategoryRowComponent({ category, onEdit, onDelete, isDeleting }: CategoryRowProps) {
  const { requestDelete, dialog } = useConfirmDelete(
    onDelete,
    `Delete category "${category.name}"?`,
    "This can't be undone."
  );
  return (
    <TableRow>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell>
        <StatusBadge tone={transactionTypeTone(category.type)}>{category.type}</StatusBadge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-8"
            onClick={() => onEdit(category)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            onClick={() => requestDelete(category.id)}
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

export const CategoryRow = memo(CategoryRowComponent);
