'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { goalSchema, type GoalInput } from '@repo/shared/schemas';
import { parseSupabaseError } from '@repo/shared/utils';
import { useGoals } from '@/hooks/useGoals';
import { GoalInflationHelper } from '@/components/GoalInflationHelper';
import { GoalIconPicker } from '@/components/goals/GoalIconPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

/** Goals created before the dedicated `icon` column (2026-10-29) stored an emoji as a
 * literal prefix on `goal_name` instead — this still strips that off for display/editing
 * so pre-migration goals keep rendering correctly. New goals never write this format. */
export function extractEmoji(str?: string): { emoji: string | null; cleanText: string } {
  if (!str) return { emoji: null, cleanText: '' };
  const match = str.match(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83E[\uDD00-\uDDFF])\s*(.*)$/u);
  if (match && match[1]) {
    return { emoji: match[1], cleanText: (match[2] ?? '').trim() };
  }
  return { emoji: null, cleanText: str.trim() };
}

interface GoalFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editing?: { id: string } & GoalInput;
}

export function GoalForm({ onSuccess, onCancel, editing }: GoalFormProps) {
  const { createGoal, updateGoal } = useGoals();
  const [formError, setFormError] = useState<string | null>(null);
  const legacyEmoji = extractEmoji(editing?.goal_name).emoji;
  const [selectedIcon, setSelectedIcon] = useState<string | null>(editing?.icon ?? null);

  const form = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: editing
      ? { ...editing, goal_name: legacyEmoji ? extractEmoji(editing.goal_name).cleanText : editing.goal_name }
      : {
          priority: 'Medium',
          saved_amount: 0,
        },
  });

  const targetDate = form.watch('target_date');

  function handleSelectIcon(iconName: string) {
    setSelectedIcon(iconName);
    form.setValue('icon', iconName, { shouldValidate: true });
  }

  async function onSubmit(data: GoalInput) {
    setFormError(null);
    try {
      if (editing) {
        await updateGoal({ id: editing.id, data });
      } else {
        await createGoal(data);
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
          <DialogTitle>{editing ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <DialogBody>
            <FormField
              control={form.control}
              name="goal_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name & Icon</FormLabel>
                  <div className="flex gap-2">
                    <GoalIconPicker selectedIcon={selectedIcon} onSelect={handleSelectIcon} />
                    <FormControl className="flex-1">
                      <Input placeholder="e.g., Buy a Car, Vacation, Dream House" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Savings, Investment, Lifestyle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount</FormLabel>
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

            <GoalInflationHelper
              targetDate={targetDate}
              onApply={(amount) => form.setValue('target_amount', amount, { shouldValidate: true })}
            />

            <FormField
              control={form.control}
              name="saved_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saved Amount</FormLabel>
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
              name="target_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Date</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
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
                {form.formState.isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Save Goal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
