'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { AccountForm } from '@/components/AccountForm';
import { CategoryForm } from '@/components/CategoryForm';
import { AccountRow } from '@/components/settings/AccountRow';
import { CategoryRow } from '@/components/settings/CategoryRow';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import type { Account, Category } from '@repo/shared/types';

type SettingsTab = 'accounts' | 'categories';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('accounts');
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: accounts, isLoading: accountsLoading, error: accountsError, deleteAccount, isDeleting: isDeletingAccount } = useAccounts();
  const { data: categories, isLoading: categoriesLoading, error: categoriesError, deleteCategory, isDeleting: isDeletingCategory } = useCategories();

  const handleDeleteAccount = useCallback((id: string) => deleteAccount(id), [deleteAccount]);
  const handleDeleteCategory = useCallback((id: string) => deleteCategory(id), [deleteCategory]);

  function closeForm() {
    setShowForm(false);
    setEditingAccount(null);
    setEditingCategory(null);
  }

  const isLoading = activeTab === 'accounts' ? accountsLoading : categoriesLoading;
  const error = activeTab === 'accounts' ? accountsError : categoriesError;
  const addLabel = activeTab === 'accounts' ? 'Account' : 'Category';

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage the accounts and categories used across your transactions."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            Add {addLabel}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-6">
          {accountsLoading ? (
            <LoadingState label="Loading accounts..." />
          ) : accountsError ? (
            <ErrorState error={accountsError} />
          ) : (
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
                      onDelete={handleDeleteAccount}
                      isDeleting={isDeletingAccount}
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
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          {categoriesLoading ? (
            <LoadingState label="Loading categories..." />
          ) : categoriesError ? (
            <ErrorState error={categoriesError} />
          ) : (
            <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((category) => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      onEdit={setEditingCategory}
                      onDelete={handleDeleteCategory}
                      isDeleting={isDeletingCategory}
                    />
                  ))}
                  {categories?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground h-32 text-center">
                        No categories yet. Add your first category to start logging transactions.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {(showForm && activeTab === 'accounts') || editingAccount ? (
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
      ) : null}

      {(showForm && activeTab === 'categories') || editingCategory ? (
        <CategoryForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingCategory
              ? { id: editingCategory.id, name: editingCategory.name, type: editingCategory.type }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
