'use client';

import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';
import { useFxRates } from '@/hooks/useFxRates';
import { useAllTimeTransactions } from '@/hooks/useReportsData';
import { AccountForm } from '@/components/AccountForm';
import { AccountRow } from '@/components/settings/AccountRow';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import type { Account } from '@repo/shared/types';
import { BASE_CURRENCY, calculateAccountBalances } from '@repo/shared/logic';

export function AccountsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const { data: accounts, isLoading, error, deleteAccount, isDeleting } = useAccounts();
  const { data: transactions } = useAllTimeTransactions();
  const { rates: fxRates, isStale: fxRatesStale, fetchedAt: fxRatesFetchedAt } = useFxRates();
  const hasForeignAccount = (accounts ?? []).some((a) => a.currency !== BASE_CURRENCY);

  // Opening balance never reflects reality once a single transaction has posted — this is the
  // one place in the app where every account's running balance (opening + every transaction
  // against it) is shown, reusing the same calculateAccountBalances the dashboard/reports
  // already use rather than a second balance calculation.
  const currentBalanceByAccountId = useMemo(() => {
    if (!accounts || !transactions) return new Map<string, number>();
    return new Map(calculateAccountBalances(accounts, transactions).map((b) => [b.accountId, b.balance]));
  }, [accounts, transactions]);

  const handleDelete = useCallback((id: string) => deleteAccount(id), [deleteAccount]);
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingAccount(null);
  }, []);

  if (isLoading) return <LoadingState label="Loading accounts..." />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4" />
          Add Account
        </Button>
      </div>

      {fxRatesStale && fxRatesFetchedAt && hasForeignAccount && (
        <p className="text-muted-foreground mb-3 text-xs">
          Exchange rates as of{' '}
          {new Date(fxRatesFetchedAt).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
          })}{' '}
          — the live rate provider is unreachable, so the ≈ conversions below use the last successful fetch.
        </p>
      )}

      <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Opening Balance</TableHead>
              <TableHead className="text-right">Current Balance</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts?.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                onEdit={setEditingAccount}
                onDelete={handleDelete}
                isDeleting={isDeleting}
                fxRates={fxRates}
                currentBalance={currentBalanceByAccountId.get(account.id)}
              />
            ))}
            {accounts?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground h-32 text-center">
                  No accounts yet. Add your first account to start logging transactions.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(showForm || editingAccount) && (
        <AccountForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingAccount
              ? {
                  id: editingAccount.id,
                  name: editingAccount.name,
                  type: editingAccount.type,
                  opening_balance: editingAccount.opening_balance,
                  currency: editingAccount.currency,
                  is_active: editingAccount.is_active,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
