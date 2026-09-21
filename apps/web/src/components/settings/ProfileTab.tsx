'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Sparkles, Camera } from 'lucide-react';
import { userProfileSchema, type UserProfileInput } from '@repo/shared/schemas';
import { parseSupabaseError } from '@repo/shared/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { FinancialEssentialsCard } from '@/components/dashboard/FinancialEssentialsCard';
import { cn } from '@/lib/utils';

function AvatarUploader() {
  const { user } = useAuth();
  const avatarUrl = useAvatarUrl();
  const { uploadAvatar, isUploading } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??';

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file next time
    if (!file) return;
    try {
      await uploadAvatar(file);
      toast.success('Profile picture updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update profile picture.');
    }
  }

  return (
    <div className="mb-5 flex items-center gap-4">
      <Avatar className="size-16">
        {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
        <AvatarFallback className="text-base">{initials}</AvatarFallback>
      </Avatar>
      <div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          <Camera className="size-4" />
          {isUploading ? 'Uploading...' : 'Change photo'}
        </Button>
        <p className="text-muted-foreground mt-1.5 text-xs">JPG or PNG, up to 3MB.</p>
      </div>
    </div>
  );
}

const ANALYSIS_DURATION_MS = 7000;

type AnalysisPhase = 'idle' | 'analyzing' | 'done';

function RoadmapPanel({ phase }: { phase: AnalysisPhase }) {
  const [progressFilled, setProgressFilled] = useState(false);

  useEffect(() => {
    if (phase !== 'analyzing') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizing animation progress with phase change
      setProgressFilled(false);
      return;
    }
    // Two rAFs: the first commits the 0% width to the DOM, the second (a frame later) flips
    // to 100% — starting the transition from an already-painted 0% instead of the same tick,
    // which browsers otherwise skip animating.
    setProgressFilled(false);
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setProgressFilled(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [phase]);

  if (phase === 'idle') {
    return (
      <div className="bg-card border-border/60 flex h-full flex-col items-center justify-center rounded-2xl border p-8 text-center">
        <Sparkles className="text-muted-foreground size-8" />
        <h2 className="mt-3 text-sm font-semibold">Your Financial Roadmap</h2>
        <p className="text-muted-foreground mt-1 max-w-xs text-sm">
          Save your profile to generate a personalized breakdown of your insurance cover and
          savings goals.
        </p>
      </div>
    );
  }

  if (phase === 'analyzing') {
    return (
      <div className="bg-card border-border/60 flex h-full flex-col items-center justify-center rounded-2xl border p-8 text-center">
        <Loader2 className="text-primary size-8 animate-spin" />
        <h2 className="mt-3 text-sm font-semibold">Analyzing your profile…</h2>
        <p className="text-muted-foreground mt-1 max-w-xs text-sm">
          Calculating your recommended insurance cover and goal progress.
        </p>
        <div className="bg-muted mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full">
          <div
            className={cn(
              'bg-primary h-full rounded-full ease-linear',
              progressFilled ? 'w-full' : 'w-0'
            )}
            style={{ transitionProperty: 'width', transitionDuration: `${ANALYSIS_DURATION_MS}ms` }}
          />
        </div>
      </div>
    );
  }

  return <FinancialEssentialsCard />;
}

export function ProfileTab() {
  const { data: profile, isLoading, saveProfile, isSaving } = useUserProfile();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>('idle');

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

  useEffect(() => {
    if (analysisPhase !== 'analyzing') return;
    const timer = setTimeout(() => setAnalysisPhase('done'), ANALYSIS_DURATION_MS);
    return () => clearTimeout(timer);
  }, [analysisPhase]);

  async function onSubmit(data: UserProfileInput) {
    setFormError(null);
    setSaved(false);
    try {
      await saveProfile({ ...data, onboarding_completed: true });
      setSaved(true);
      setAnalysisPhase('analyzing');
    } catch (error) {
      setFormError(parseSupabaseError(error as Error));
    }
  }

  if (isLoading) {
    return (
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
          <div className="flex items-center gap-4 pt-2">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          <div className="space-y-4 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border-border/60 flex h-64 flex-col items-center justify-center rounded-2xl border p-8">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="mt-3 h-4 w-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Your Profile</h2>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">
          Used to personalize the Financial Essentials Check on your Dashboard — recommended insurance
          cover and emergency fund targets. Simplified estimates, not financial advice.
        </p>

        <AvatarUploader />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} />
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

      <RoadmapPanel phase={analysisPhase} />
    </div>
  );
}
