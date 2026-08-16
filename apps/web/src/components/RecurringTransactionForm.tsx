'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recurringTransactionSchema, type RecurringTransactionInput } from '@repo/shared/schemas';
import { parseSupabaseError } from '@repo/shared/utils';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AccountSelectField } from '@/components/shared/form-fields/AccountSelectField';
import { CategorySelectField } from '@/components/shared/form-fields/CategorySelectField';
import { NotesField } from '@/components/shared/form-fields/NotesField';

interface RecurringTransactionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editing?: { id: string } & RecurringTransactionInput;
}

export function RecurringTransactionForm({ onSuccess, onCancel, editing }: RecurringTransactionFormProps) {
  const { data: accounts } = useAccounts(true);
  const { data: categories } = useCategories();
  const { createRecurringTransaction, updateRecurringTransaction } = useRecurringTransactions();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RecurringTransactionInput>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: editing ?? {
      type: 'Expense',
      frequency: 'Monthly',
      next_run_date: new Date().toISOString().split('T')[0],
    },
  });

  const transactionType = form.watch('type');

  async function onSubmit(data: RecurringTransactionInput) {
    setFormError(null);
    try {
      if (editing) {
        await updateRecurringTransaction({ id: editing.id, data });
      } else {
        await createRecurringTransaction(data);
      }
      onSuccess();
    } catch (error) {
      setFormError(parseSupabaseError(error as Error));
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Income">Income</SelectItem>
                      <SelectItem value="Expense">Expense</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_run_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starts On</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {transactionType !== 'Transfer' && (
              <CategorySelectField
                control={form.control}
                name="category_id"
                categories={categories?.filter((cat) => cat.type === transactionType)}
              />
            )}

            <AccountSelectField control={form.control} name="from_account_id" label="From Account" accounts={accounts} />

            {transactionType === 'Transfer' && (
              <AccountSelectField control={form.control} name="to_account_id" label="To Account" accounts={accounts} />
            )}

            <NotesField control={form.control} name="notes" label="Description" />

            {formError && <p className="text-destructive text-sm">{formError}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Save Recurring Transaction'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
