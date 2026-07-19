'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userProfileSchema, type UserProfileInput } from '@repo/shared/schemas';
import { parseSupabaseError } from '@repo/shared/utils';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingState } from '@/components/shared/QueryState';

export function ProfileTab() {
  const { data: profile, isLoading, saveProfile, isSaving } = useUserProfile();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<UserProfileInput>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: { number_of_dependents: 0, onboarding_completed: true },
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      date_of_birth: profile.date_of_birth ?? undefined,
      monthly_income: profile.monthly_income ?? undefined,
      monthly_expense: profile.monthly_expense ?? undefined,
      number_of_dependents: profile.number_of_dependents,
      onboarding_completed: true,
    });
  }, [profile, form]);

  async function onSubmit(data: UserProfileInput) {
    setFormError(null);
    setSaved(false);
    try {
      await saveProfile({ ...data, onboarding_completed: true });
      setSaved(true);
    } catch (error) {
      setFormError(parseSupabaseError(error as Error));
    }
  }

  if (isLoading) return <LoadingState label="Loading profile..." />;

  return (
    <div className="bg-card border-border/60 max-w-lg rounded-2xl border p-5 shadow-sm">
      <h2 className="text-sm font-semibold">Your Profile</h2>
      <p className="text-muted-foreground mt-1 mb-4 text-sm">
        Used to personalize the Financial Essentials Check on your Dashboard — recommended insurance
        cover and emergency fund targets. Simplified estimates, not financial advice.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthly_income"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Income</FormLabel>
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
            name="monthly_expense"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Expense (estimate)</FormLabel>
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
                <p className="text-muted-foreground text-xs">
                  Only used until you have 3 months of real transaction history.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="number_of_dependents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Dependents</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    value={field.value ?? 0}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && <p className="text-destructive text-sm">{formError}</p>}
          {saved && !formError && <p className="text-success text-sm">Profile saved.</p>}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
