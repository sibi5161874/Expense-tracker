'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';
import { useFxRates } from '@/hooks/useFxRates';
import { AccountForm } from '@/components/AccountForm';
import { AccountRow } from '@/components/settings/AccountRow';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import type { Account } from '@repo/shared/types';

export function AccountsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const { data: accounts, isLoading, error, deleteAccount, isDeleting } = useAccounts();
  const { rates: fxRates } = useFxRates();

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

      <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Opening Balance</TableHead>
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
              />
            ))}
            {accounts?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground h-32 text-center">
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
