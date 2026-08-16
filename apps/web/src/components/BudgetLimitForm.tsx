'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { budgetLimitSchema, type BudgetLimitInput } from '@repo/shared/schemas';
import { parseSupabaseError, formatINR } from '@repo/shared/utils';
import { suggestBudgetAmount } from '@repo/shared/logic';
import { useCategories } from '@/hooks/useCategories';
import { useBudgetLimits } from '@/hooks/useBudgetLimits';
import { useTransactionsInRange, monthsAgo } from '@/hooks/useReportsData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CategorySelectField } from '@/components/shared/form-fields/CategorySelectField';

const SUGGESTION_MONTHS_BACK = 3;

interface BudgetLimitFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editing?: { id: string } & BudgetLimitInput;
}

export function BudgetLimitForm({ onSuccess, onCancel, editing }: BudgetLimitFormProps) {
  const { data: categories } = useCategories('Expense');
  const { createBudgetLimit, updateBudgetLimit } = useBudgetLimits();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<BudgetLimitInput>({
    resolver: zodResolver(budgetLimitSchema),
    defaultValues: editing,
  });

  const { data: recentTransactions } = useTransactionsInRange(
    monthsAgo(SUGGESTION_MONTHS_BACK),
    monthsAgo(0)
  );
  const selectedCategoryId = form.watch('category_id');
  const suggestedAmount = useMemo(() => {
    if (!selectedCategoryId || !recentTransactions) return null;
    return suggestBudgetAmount(recentTransactions, selectedCategoryId, SUGGESTION_MONTHS_BACK);
  }, [recentTransactions, selectedCategoryId]);

  async function onSubmit(data: BudgetLimitInput) {
    setFormError(null);
    try {
      if (editing) {
        await updateBudgetLimit({ id: editing.id, data });
      } else {
        await createBudgetLimit(data);
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
          <DialogTitle>{editing ? 'Edit Budget Limit' : 'Add Budget Limit'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CategorySelectField control={form.control} name="category_id" categories={categories} />

            <FormField
              control={form.control}
              name="monthly_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Limit</FormLabel>
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
                  {suggestedAmount !== null && (
                    <p className="text-muted-foreground text-sm">
                      Suggested: {formatINR(suggestedAmount)} (avg. last {SUGGESTION_MONTHS_BACK} months)
                      {' — '}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => form.setValue('monthly_limit', suggestedAmount, { shouldValidate: true })}
                      >
                        Use this
                      </button>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError && <p className="text-destructive text-sm">{formError}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Save Limit'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
