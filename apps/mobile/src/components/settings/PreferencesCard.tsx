import { useEffect, useState } from "react";
import { View, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";
import { Switch } from "@/components/common/Switch";
import { PickerField } from "@/components/common/PickerField";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useEntitlements } from "@/hooks/useEntitlements";

const LANGUAGE_STORAGE_KEY = "@preferred-language";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "🇪🇸 Spanish" },
  { value: "zh-Hans", label: "🇨🇳 Simplified Chinese" },
  { value: "hi", label: "🇮🇳 Hindi" },
  { value: "ar", label: "🇸🇦 Arabic" },
  { value: "fr", label: "🇫🇷 French" },
  { value: "pt-BR", label: "🇧🇷 Portuguese (Brazil)" },
  { value: "ru", label: "🇷🇺 Russian" },
  { value: "ja", label: "🇯🇵 Japanese" },
  { value: "de", label: "🇩🇪 German" },
];

export function PreferencesCard() {
  const [language, setLanguage] = useState("en");
  const { data: profile, saveProfile, isSaving: isSavingReportEmail } = useUserProfile();
  const { hasFeature } = useEntitlements();
  const canReceiveReportEmail = hasFeature("reportExport");
  const reportEmailEnabled = profile?.monthly_report_email_enabled ?? false;

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((stored) => {
      if (stored) setLanguage(stored);
    });
  }, []);

  async function handleLanguageChange(value: string) {
    setLanguage(value);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, value);
  }

  async function handleReportEmailToggle(checked: boolean) {
    try {
      await saveProfile({ monthly_report_email_enabled: checked });
      Alert.alert(
        "Email Reports",
        checked
          ? "You'll get your Overall Report by email on the 1st of every month."
          : "Monthly report emails turned off."
      );
    } catch {
      Alert.alert("Error", "Could not update this setting — please try again.");
    }
  }

  return (
    <View className="gap-5 rounded-2xl bg-card p-5">
      <View>
        <AppText className="text-sm font-semibold">Preferences</AppText>
        <AppText className="mt-1 text-sm text-muted-foreground">
          Customize your display language and automated report delivery.
        </AppText>
      </View>

      <View className="gap-2 border-t border-border pt-4">
        <PickerField
          label="Preferred Language"
          value={language}
          options={LANGUAGES}
          onChange={handleLanguageChange}
        />
        <AppText className="text-xs text-muted-foreground">
          Only English is fully translated today — other languages are saved for when translations ship.
        </AppText>
      </View>

      <View className="gap-3 border-t border-border pt-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <AppText className="text-sm font-medium">Monthly Overall Report</AppText>
            <AppText className="mt-0.5 text-xs text-muted-foreground">
              Get your Overall Report emailed to you automatically at 6:00 AM IST on the 1st of every month.
            </AppText>
            {!canReceiveReportEmail && (
              <AppText className="mt-1 text-xs text-primary font-medium">
                Requires Pro — same as PDF report export.
              </AppText>
            )}
          </View>
          {canReceiveReportEmail ? (
            <Switch
              value={reportEmailEnabled}
              onValueChange={handleReportEmailToggle}
              disabled={isSavingReportEmail}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onPress={() => router.push("/(app)/billing")}
            >
              Upgrade
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}
