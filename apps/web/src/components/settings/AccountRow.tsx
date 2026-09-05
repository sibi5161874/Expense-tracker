import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Account } from '@repo/shared/types';
import { formatCurrency, formatINR } from '@repo/shared/utils/currency';
import { convertToBaseCurrency, BASE_CURRENCY, type FxRates } from '@repo/shared/logic';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';

interface AccountRowProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  fxRates: FxRates;
}

function AccountRowComponent({ account, onEdit, onDelete, isDeleting, fxRates }: AccountRowProps) {
  const isForeign = account.currency !== BASE_CURRENCY;
  const converted = isForeign ? convertToBaseCurrency(account.opening_balance, account.currency, fxRates) : null;
  const { requestDelete, dialog } = useConfirmDelete(
    onDelete,
    `Delete account "${account.name}"?`,
    "This can't be undone."
  );

  return (
    <TableRow>
      <TableCell className="font-medium">{account.name}</TableCell>
      <TableCell className="text-muted-foreground">{account.type}</TableCell>
      <TableCell className="text-right">
        {formatCurrency(account.opening_balance, account.currency)}
        {isForeign && (
          <span className="text-muted-foreground ml-1.5 text-xs">
            {converted !== null ? `≈ ${formatINR(converted)}` : '(rate unavailable)'}
          </span>
        )}
      </TableCell>
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
            onClick={() => requestDelete(account.id)}
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

export const AccountRow = memo(AccountRowComponent);
