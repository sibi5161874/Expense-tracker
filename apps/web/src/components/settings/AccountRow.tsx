import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Account } from '@repo/shared/types';
import { formatINR } from '@repo/shared/utils/currency';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface AccountRowProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function AccountRowComponent({ account, onEdit, onDelete, isDeleting }: AccountRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{account.name}</TableCell>
      <TableCell className="text-muted-foreground">{account.type}</TableCell>
      <TableCell className="text-right">{formatINR(account.opening_balance)}</TableCell>
      <TableCell>{account.currency}</TableCell>
      <TableCell>
        <StatusBadge tone={account.is_active ? 'success' : 'neutral'}>
          {account.is_active ? 'Active' : 'Inactive'}
        </StatusBadge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-8"
            onClick={() => onEdit(account)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            onClick={() => {
              if (confirm(`Delete account "${account.name}"? This cannot be undone.`)) {
                onDelete(account.id);
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

export const AccountRow = memo(AccountRowComponent);
