import { Platform, Pressable, View } from "react-native";
import { Check } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { SettingsRow } from "@/components/common/SettingsRow";
import { SettingsSection } from "@/components/common/SettingsSection";
import { Switch } from "@/components/common/Switch";
import { useThemePreference } from "@/hooks/useThemePreference";
import { useTheme } from "@/theme/ThemeProvider";
import { accents, type AccentKey } from "@/theme/tokens";
import type { ThemePreference } from "@/lib/themePreference";

const OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const ACCENT_KEYS = Object.keys(accents) as AccentKey[];
const SWATCH_SIZE = 40;

function AccentSwatch({ accentKey, selected, onPress }: { accentKey: AccentKey; selected: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  const definition = accents[accentKey];
  const swatchColor = definition[theme.mode].primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={definition.label}
      accessibilityState={{ selected }}
      hitSlop={6}
      style={{
        width: SWATCH_SIZE,
        height: SWATCH_SIZE,
        borderRadius: SWATCH_SIZE / 2,
        backgroundColor: swatchColor,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: selected ? 2 : 0,
        borderColor: theme.foreground,
      }}
    >
      {selected && <Check size={18} color={definition[theme.mode].onPrimary} />}
    </Pressable>
  );
}

export function AppearanceCard() {
  const { preference, setPreference, loaded } = useThemePreference();
  const { theme, loaded: themeLoaded, setAccent, setAmoled, setDynamicColor } = useTheme();

  return (
    <SettingsSection
      title="Appearance"
      description={'"System" follows your device automatically. Choose Light or Dark to override it.'}
    >
      {loaded && (
        <View className="p-4">
          <SegmentedControl options={OPTIONS} value={preference} onChange={(v) => setPreference(v as ThemePreference)} />
        </View>
      )}

      {themeLoaded && (
        <View className="gap-3 p-4">
          <AppText className="text-sm font-medium">Accent Color</AppText>
          <View className="flex-row flex-wrap gap-3">
            {ACCENT_KEYS.map((key) => (
              <AccentSwatch key={key} accentKey={key} selected={theme.accent === key} onPress={() => setAccent(key)} />
            ))}
          </View>
        </View>
      )}

      {themeLoaded && (
        <SettingsRow
          label="True Black (AMOLED)"
          description="Pure black backgrounds in Dark mode — saves battery on OLED screens."
          trailing={<Switch value={theme.amoled} onValueChange={setAmoled} disabled={theme.mode !== "dark"} />}
        />
      )}

      {/* Material You (Android 12+) reads the accent from the device wallpaper — meaningless
       * on iOS, which has no equivalent OS-level palette to read. Locked off for now: turning
       * it on needs a native module this Expo config doesn't include yet (see
       * lib/themePreference.ts's loadDynamicColorPreference doc comment). Shown disabled
       * rather than hidden so the setting is discoverable instead of silently absent. */}
      {themeLoaded && Platform.OS === "android" && (
        <SettingsRow
          label="Dynamic Color"
          description="Match accent colors to your wallpaper (Material You). Coming soon."
          trailing={<Switch value={theme.dynamicColor} onValueChange={setDynamicColor} disabled />}
        />
      )}
    </SettingsSection>
  );
}
