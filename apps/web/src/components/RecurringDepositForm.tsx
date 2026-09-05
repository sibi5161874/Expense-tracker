'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assetRecurringDepositSchema, type AssetRecurringDepositInput } from '@repo/shared/schemas';
import { parseSupabaseError } from '@repo/shared/utils';
import { useRecurringDeposits } from '@/hooks/useAssets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface RecurringDepositFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editing?: { id: string } & AssetRecurringDepositInput;
}

export function RecurringDepositForm({ onSuccess, onCancel, editing }: RecurringDepositFormProps) {
  const { create, update } = useRecurringDeposits();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<AssetRecurringDepositInput>({
    resolver: zodResolver(assetRecurringDepositSchema),
    defaultValues: editing,
  });

  async function onSubmit(data: AssetRecurringDepositInput) {
    setFormError(null);
    try {
      if (editing) {
        await update({ id: editing.id, data });
      } else {
        await create(data);
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
          <DialogTitle>{editing ? 'Edit Recurring Deposit' : 'Add Recurring Deposit'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <DialogBody>
            <FormField
              control={form.control}
              name="bank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., HDFC Bank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthly_installment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Installment</FormLabel>
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
                name="rate_pct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (%)</FormLabel>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maturity_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maturity Date</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="maturity_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maturity Value</FormLabel>
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

            {formError && <p className="text-destructive text-sm">{formError}</p>}

            </DialogBody>

            <DialogFooter className="sm:justify-stretch">
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Save RD'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
