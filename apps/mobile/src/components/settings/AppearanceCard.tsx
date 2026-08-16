import { View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { useThemePreference } from "@/hooks/useThemePreference";
import type { ThemePreference } from "@/lib/themePreference";

const OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function AppearanceCard() {
  const { preference, setPreference, loaded } = useThemePreference();

  return (
    <View className="gap-3 rounded-2xl bg-card p-5">
      <View>
        <AppText className="text-sm font-semibold">Appearance</AppText>
        <AppText className="mt-1 text-sm text-muted-foreground">
          "System" follows your device automatically. Choose Light or Dark to override it.
        </AppText>
      </View>
      {loaded && <SegmentedControl options={OPTIONS} value={preference} onChange={(v) => setPreference(v as ThemePreference)} />}
    </View>
  );
}
