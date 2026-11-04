import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Account } from '@repo/shared/types';
import { formatCurrency, formatINR } from '@repo/shared/utils/currency';
import { convertToBaseCurrency, BASE_CURRENCY, type FxRates } from '@repo/shared/logic';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useTranslation } from '@/contexts/LocaleContext';

interface AccountRowProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  fxRates: FxRates;
  /** Opening balance + every transaction posted against this account since; undefined while
   * the transaction history is still loading. */
  currentBalance: number | undefined;
}

function AccountRowComponent({ account, onEdit, onDelete, isDeleting, fxRates, currentBalance }: AccountRowProps) {
  const isForeign = account.currency !== BASE_CURRENCY;
  const converted = isForeign ? convertToBaseCurrency(account.opening_balance, account.currency, fxRates) : null;
  const convertedCurrent =
    isForeign && currentBalance !== undefined ? convertToBaseCurrency(currentBalance, account.currency, fxRates) : null;
  const { t } = useTranslation();
  const { requestDelete, dialog } = useConfirmDelete(
    onDelete,
    t('confirm.deleteAccount.title', { name: account.name }),
    t('common.cannotBeUndone')
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
      <TableCell className="text-right font-medium">
        {currentBalance === undefined ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <>
            {formatCurrency(currentBalance, account.currency)}
            {isForeign && (
              <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                {convertedCurrent !== null ? `≈ ${formatINR(convertedCurrent)}` : '(rate unavailable)'}
              </span>
            )}
          </>
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

/** Mobile counterpart to AccountRow — same data/logic, rendered as a card instead of a
 * `<TableRow>` so it can be used outside a `<Table>` below `md:`. */
function AccountCardComponent({ account, onEdit, onDelete, isDeleting, fxRates, currentBalance }: AccountRowProps) {
  const isForeign = account.currency !== BASE_CURRENCY;
  const converted = isForeign ? convertToBaseCurrency(account.opening_balance, account.currency, fxRates) : null;
  const convertedCurrent =
    isForeign && currentBalance !== undefined ? convertToBaseCurrency(currentBalance, account.currency, fxRates) : null;
  const { t } = useTranslation();
  const { requestDelete, dialog } = useConfirmDelete(
    onDelete,
    t('confirm.deleteAccount.title', { name: account.name }),
    t('common.cannotBeUndone')
  );

  return (
    <div className="bg-card space-y-2 rounded-2xl border border-border/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium">{account.name}</div>
          <div className="text-muted-foreground text-xs">
            {account.type} · {account.currency}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <StatusBadge tone={account.is_active ? 'success' : 'neutral'}>
            {account.is_active ? 'Active' : 'Inactive'}
          </StatusBadge>
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
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
        <div className="space-y-0.5">
          <div className="text-muted-foreground text-xs">Opening Balance</div>
          <div>
            {formatCurrency(account.opening_balance, account.currency)}
            {isForeign && (
              <div className="text-muted-foreground text-xs">
                {converted !== null ? `≈ ${formatINR(converted)}` : '(rate unavailable)'}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="text-muted-foreground text-xs">Current Balance</div>
          <div className="font-medium">
            {currentBalance === undefined ? (
              <span className="text-muted-foreground font-normal">—</span>
            ) : (
              <>
                {formatCurrency(currentBalance, account.currency)}
                {isForeign && (
                  <div className="text-muted-foreground text-xs font-normal">
                    {convertedCurrent !== null ? `≈ ${formatINR(convertedCurrent)}` : '(rate unavailable)'}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {dialog}
    </div>
  );
}

export const AccountCard = memo(AccountCardComponent);
