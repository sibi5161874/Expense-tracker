'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userProfileSchema, type UserProfileInput } from '@repo/shared/schemas';
import { parseSupabaseError } from '@repo/shared/utils';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';

const STEPS = [
  { title: 'About you', fields: ['date_of_birth', 'number_of_dependents'] as const },
  { title: 'Your income', fields: ['monthly_income'] as const },
  { title: 'Your expenses', fields: ['monthly_expense'] as const },
];

interface OnboardingWizardProps {
  onDone: () => void;
}

export function OnboardingWizard({ onDone }: OnboardingWizardProps) {
  const { saveProfile } = useUserProfile();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UserProfileInput>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: { number_of_dependents: 0, onboarding_completed: false },
  });

  const isLastStep = step === STEPS.length - 1;

  async function handleNext() {
    const valid = await form.trigger(STEPS[step].fields as unknown as (keyof UserProfileInput)[]);
    if (!valid) return;
    if (isLastStep) {
      await handleFinish(form.getValues());
    } else {
      setStep((s) => s + 1);
    }
  }

  async function handleFinish(data: UserProfileInput) {
    setError(null);
    try {
      await saveProfile({ ...data, onboarding_completed: true });
      onDone();
    } catch (e) {
      setError(parseSupabaseError(e as Error));
    }
  }

  async function handleSkip() {
    setError(null);
    try {
      await saveProfile({ onboarding_completed: true });
      onDone();
    } catch (e) {
      setError(parseSupabaseError(e as Error));
    }
  }

  return (
    <div className="bg-background fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-primary' : 'bg-muted')}
            />
          ))}
        </div>

        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">
          Step {step + 1} of {STEPS.length}
        </p>
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">{STEPS[step].title}</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Helps us recommend how much insurance cover you actually need — you can skip this and fill it in
          later from Settings.
        </p>

        <Form {...form}>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {step === 0 && (
              <>
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
              </>
            )}

            {step === 1 && (
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
            )}

            {step === 2 && (
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
                      Just an estimate for now — once you&apos;ve logged 3 months of transactions we&apos;ll switch to
                      your real average automatically.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex items-center justify-between pt-4">
              <Button type="button" variant="ghost" onClick={handleSkip} disabled={form.formState.isSubmitting}>
                Skip for now
              </Button>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                    Back
                  </Button>
                )}
                <Button type="button" onClick={handleNext} disabled={form.formState.isSubmitting}>
                  {isLastStep ? (form.formState.isSubmitting ? 'Saving...' : 'Finish') : 'Next'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
