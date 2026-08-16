import { useEffect, useState } from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { userProfileSchema, type UserProfileInput } from "@repo/shared/schemas";
import { parseSupabaseError } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import { AppText } from "@/components/common/AppText";
import { AnonymousUpgradeCard } from "@/components/settings/AnonymousUpgradeCard";
import { AppearanceCard } from "@/components/settings/AppearanceCard";
import { useThemeColor } from "@/lib/colors";

export default function SettingsScreen() {
  const { isAnonymous } = useAuth();
  const { data: profile, isLoading, saveProfile, isSaving } = useUserProfile();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const primary = useThemeColor("primary");

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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader title="Settings" description="Your profile and app preferences." />

        {isAnonymous && <AnonymousUpgradeCard />}

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : (
          <View className="gap-4 rounded-2xl bg-card p-5">
            <View>
              <AppText className="text-sm font-semibold">Your Profile</AppText>
              <AppText className="mt-1 text-sm text-muted-foreground">
                Used to personalize the Financial Essentials Check on your Dashboard — recommended insurance cover
                and emergency fund targets. Simplified estimates, not financial advice.
              </AppText>
            </View>

            <Controller
              control={form.control}
              name="date_of_birth"
              render={({ field, fieldState }) => (
                <TextField label="Date of Birth" value={field.value ?? ""} onChangeText={field.onChange} placeholder="YYYY-MM-DD" error={fieldState.error?.message} />
              )}
            />

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

            {formError && <AppText className="text-sm text-destructive">{formError}</AppText>}
            {saved && !formError && <AppText className="text-sm text-success">Profile saved.</AppText>}

            <Button onPress={form.handleSubmit(onSubmit)} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </View>
        )}

        <AppearanceCard />
      </ScrollView>
    </SafeAreaView>
  );
}
