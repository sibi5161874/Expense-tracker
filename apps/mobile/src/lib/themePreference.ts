import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "nativewind";

export type ThemePreference = "light" | "dark" | "system";

export const THEME_PREFERENCE_STORAGE_KEY = "theme-preference";

/** Called once at app boot (see app/_layout.tsx) — applies whatever the user last chose
 * before the first screen renders, rather than always starting on "system" and flashing
 * the wrong theme for a frame. */
export async function loadThemePreference(): Promise<ThemePreference> {
  const stored = await AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
  const preference: ThemePreference = stored === "light" || stored === "dark" ? stored : "system";
  colorScheme.set(preference);
  return preference;
}

/** Persists the choice and applies it immediately via NativeWind's colorScheme — every
 * `dark:` className and every useThemeColor()/useChartPalette() call re-resolves off this
 * same source, so there's nothing else to keep in sync. */
export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  colorScheme.set(preference);
  await AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference);
}
