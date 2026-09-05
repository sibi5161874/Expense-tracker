'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, type TransactionInput } from '@repo/shared/schemas';
import { parseSupabaseError } from '@repo/shared/utils';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AccountSelectField } from '@/components/shared/form-fields/AccountSelectField';
import { CategorySelectField } from '@/components/shared/form-fields/CategorySelectField';
import { NotesField } from '@/components/shared/form-fields/NotesField';

interface TransactionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editing?: { id: string } & TransactionInput;
}

export function TransactionForm({ onSuccess, onCancel, editing }: TransactionFormProps) {
  const { data: accounts } = useAccounts(true);
  const { data: categories } = useCategories();
  const { createTransaction, updateTransaction } = useTransactions();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: editing ?? {
      type: 'Expense',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const transactionType = form.watch('type');

  async function onSubmit(data: TransactionInput) {
    setFormError(null);
    try {
      if (editing) {
        await updateTransaction({ id: editing.id, data });
        toast.success('Transaction updated.');
      } else {
        await createTransaction(data);
        toast.success('Transaction added.');
      }
      onSuccess();
    } catch (error) {
      setFormError(parseSupabaseError(error as Error));
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <DialogBody>
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

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="sub_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional sub category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <NotesField control={form.control} name="notes" />

            {formError && <p className="text-destructive text-sm">{formError}</p>}

            </DialogBody>

            <DialogFooter className="sm:justify-stretch">
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Save Transaction'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
