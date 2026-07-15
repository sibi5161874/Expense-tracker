'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { investmentLogSchema, type InvestmentLogInput } from '@repo/shared/schemas';
import { parseSupabaseError } from '@repo/shared/utils';
import { useAccounts } from '@/hooks/useAccounts';
import { useInvestmentLog } from '@/hooks/useInvestmentLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AccountSelectField } from '@/components/shared/form-fields/AccountSelectField';
import { NotesField } from '@/components/shared/form-fields/NotesField';
import { InvestmentActionFields } from '@/components/investments/InvestmentActionFields';

interface InvestmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editing?: { id: string } & InvestmentLogInput;
}

export function InvestmentForm({ onSuccess, onCancel, editing }: InvestmentFormProps) {
  const { data: accounts } = useAccounts(true);
  const { createInvestmentLog, updateInvestmentLog } = useInvestmentLog();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<InvestmentLogInput>({
    resolver: zodResolver(investmentLogSchema),
    defaultValues: editing ?? {
      action: 'BUY',
      date: new Date().toISOString().split('T')[0],
      fees: 0,
    },
  });

  const action = form.watch('action');

  async function onSubmit(data: InvestmentLogInput) {
    setFormError(null);
    try {
      if (editing) {
        await updateInvestmentLog({ id: editing.id, data });
      } else {
        await createInvestmentLog(data);
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
          <DialogTitle>{editing ? 'Edit Investment' : 'Add Investment'}</DialogTitle>
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
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., RELIANCE, HDFCBANK" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exchange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., NSE, BSE" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BUY">BUY</SelectItem>
                      <SelectItem value="SELL">SELL</SelectItem>
                      <SelectItem value="SIP">SIP</SelectItem>
                      <SelectItem value="DIVIDEND">DIVIDEND</SelectItem>
                      <SelectItem value="BONUS">BONUS</SelectItem>
                      <SelectItem value="SPLIT">SPLIT</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <InvestmentActionFields control={form.control} action={action} />

            <AccountSelectField
              control={form.control}
              name="linked_account_id"
              label="Linked Account"
              accounts={accounts}
            />

            <FormField
              control={form.control}
              name="asset_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Stock">Stock</SelectItem>
                      <SelectItem value="ETF">ETF</SelectItem>
                      <SelectItem value="Mutual Fund">Mutual Fund</SelectItem>
                      <SelectItem value="Crypto">Crypto</SelectItem>
                      <SelectItem value="Bond">Bond</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                {form.formState.isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Save Investment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
