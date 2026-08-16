import { useState } from "react";
import { Modal, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userProfileSchema, type UserProfileInput } from "@repo/shared/schemas";
import { parseSupabaseError } from "@repo/shared/utils";
import { useUserProfile } from "@/hooks/useUserProfile";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";

const STEPS = [
  { title: "About you", fields: ["date_of_birth", "number_of_dependents"] as const },
  { title: "Your income", fields: ["monthly_income"] as const },
  { title: "Your expenses", fields: ["monthly_expense"] as const },
];

/** Mirrors apps/web/src/components/onboarding/OnboardingWizard.tsx — same 3-step flow,
 * shown by (app)/_layout.tsx whenever the loaded profile has `onboarding_completed: false`. */
export function OnboardingWizard({ onDone }: { onDone: () => void }) {
  const { saveProfile } = useUserProfile();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<UserProfileInput>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: { number_of_dependents: 0, onboarding_completed: false },
  });

  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step]!;

  async function handleNext() {
    const valid = await form.trigger(current.fields as unknown as (keyof UserProfileInput)[]);
    if (!valid) return;
    if (isLastStep) {
      await handleFinish(form.getValues());
    } else {
      setStep((s) => s + 1);
    }
  }

  async function handleFinish(data: UserProfileInput) {
    setError(null);
    setSubmitting(true);
    try {
      await saveProfile({ ...data, onboarding_completed: true });
      onDone();
    } catch (e) {
      setError(parseSupabaseError(e as Error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setError(null);
    setSubmitting(true);
    try {
      await saveProfile({ onboarding_completed: true });
      onDone();
    } catch (e) {
      setError(parseSupabaseError(e as Error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible animationType="fade" presentationStyle="overFullScreen">
      <SafeAreaView className="flex-1 items-center justify-center bg-background p-6">
        <View className="w-full max-w-sm gap-6">
          <View className="flex-row gap-1.5">
            {STEPS.map((_, i) => (
              <View key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </View>

          <View className="gap-1">
            <AppText className="text-xs uppercase tracking-wide text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </AppText>
            <AppText className="text-2xl font-bold tracking-tight">{current.title}</AppText>
            <AppText className="text-sm text-muted-foreground">
              Helps us recommend how much insurance cover you actually need — skip and fill this in later from
              Settings if you'd rather.
            </AppText>
          </View>

          <View className="gap-4">
            {step === 0 && (
              <>
                <Controller
                  control={form.control}
                  name="date_of_birth"
                  render={({ field, fieldState }) => (
                    <TextField label="Date of Birth" value={field.value ?? ""} onChangeText={field.onChange} placeholder="YYYY-MM-DD" error={fieldState.error?.message} />
                  )}
                />
                <Controller
                  control={form.control}
                  name="number_of_dependents"
                  render={({ field, fieldState }) => (
                    <TextField
                      label="Number of Dependents"
                      keyboardType="decimal-pad"
                      value={String(field.value ?? 0)}
                      onChangeText={(t) => field.onChange(t ? Number(t) : 0)}
                      placeholder="0"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </>
            )}

            {step === 1 && (
              <Controller
                control={form.control}
                name="monthly_income"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Monthly Income"
                    keyboardType="decimal-pad"
                    value={field.value != null ? String(field.value) : ""}
                    onChangeText={(t) => field.onChange(t ? Number(t) : undefined)}
                    placeholder="0.00"
                    error={fieldState.error?.message}
                  />
                )}
              />
            )}

            {step === 2 && (
              <Controller
                control={form.control}
                name="monthly_expense"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Monthly Expense (estimate)"
                    keyboardType="decimal-pad"
                    value={field.value != null ? String(field.value) : ""}
                    onChangeText={(t) => field.onChange(t ? Number(t) : undefined)}
                    placeholder="0.00"
                    error={fieldState.error?.message}
                  />
                )}
              />
            )}

            {error && <AppText className="text-sm text-destructive">{error}</AppText>}
          </View>

          <View className="gap-2">
            <Button onPress={handleNext} disabled={submitting}>
              {submitting ? "Saving..." : isLastStep ? "Finish" : "Next"}
            </Button>
            <Button variant="ghost" onPress={handleSkip} disabled={submitting}>
              Skip for now
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
