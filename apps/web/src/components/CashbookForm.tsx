'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cashbookSchema, type CashbookInput } from '@repo/shared/schemas';
import { parseSupabaseError } from '@repo/shared/utils';
import { useAccounts } from '@/hooks/useAccounts';
import { useCashbook } from '@/hooks/useCashbook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AccountSelectField } from '@/components/shared/form-fields/AccountSelectField';
import { NotesField } from '@/components/shared/form-fields/NotesField';

interface CashbookFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editing?: { id: string } & CashbookInput;
}

export function CashbookForm({ onSuccess, onCancel, editing }: CashbookFormProps) {
  const { data: accounts } = useAccounts(true);
  const { createCashbook, updateCashbook } = useCashbook();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CashbookInput>({
    resolver: zodResolver(cashbookSchema),
    defaultValues: editing ?? {
      flow: 'Gave',
      date: new Date().toISOString().split('T')[0],
    },
  });

  async function onSubmit(data: CashbookInput) {
    setFormError(null);
    try {
      if (editing) {
        await updateCashbook({ id: editing.id, data });
      } else {
        await createCashbook(data);
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
          <DialogTitle>{editing ? 'Edit Cashbook Entry' : 'Add Cashbook Entry'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="counterparty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Counterparty</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe, Company XYZ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="flow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flow</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Gave">Gave (they owe you)</SelectItem>
                      <SelectItem value="Received">Received (you owe them)</SelectItem>
                    </SelectContent>
                  </Select>
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

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AccountSelectField control={form.control} name="account_used_id" label="Account Used" accounts={accounts} />

            <FormField
              control={form.control}
              name="loan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linked Loan (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional loan reference" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <NotesField control={form.control} name="notes" />

            {formError && <p className="text-destructive text-sm">{formError}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Save Entry'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
