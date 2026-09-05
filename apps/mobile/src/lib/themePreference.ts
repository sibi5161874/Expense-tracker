import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "nativewind";
import { DEFAULT_ACCENT, type AccentKey } from "@/theme/tokens";

export type ThemePreference = "light" | "dark" | "system";

export const THEME_PREFERENCE_STORAGE_KEY = "theme-preference";
export const AMOLED_PREFERENCE_STORAGE_KEY = "amoled-preference";
export const ACCENT_PREFERENCE_STORAGE_KEY = "accent-preference";
export const DYNAMIC_COLOR_STORAGE_KEY = "dynamic-color-preference";

const ACCENT_KEYS: AccentKey[] = ["ocean", "mint", "amber", "peach", "amethyst", "inferno"];

function isAccentKey(value: string | null): value is AccentKey {
  return !!value && (ACCENT_KEYS as string[]).includes(value);
}

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

/** "Use pure black" — only meaningful while resolved mode is dark; ignored in light mode.
 * See tokens.ts's neutrals.amoled comment for why this is a variant of dark, not a third
 * NativeWind color-scheme class. */
export async function loadAmoledPreference(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(AMOLED_PREFERENCE_STORAGE_KEY);
  return stored === "true";
}

export async function saveAmoledPreference(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(AMOLED_PREFERENCE_STORAGE_KEY, enabled ? "true" : "false");
}

export async function loadAccentPreference(): Promise<AccentKey> {
  const stored = await AsyncStorage.getItem(ACCENT_PREFERENCE_STORAGE_KEY);
  return isAccentKey(stored) ? stored : DEFAULT_ACCENT;
}

export async function saveAccentPreference(accent: AccentKey): Promise<void> {
  await AsyncStorage.setItem(ACCENT_PREFERENCE_STORAGE_KEY, accent);
}

/** Android 12+ Material You wallpaper-derived palette. When on, the manual accent picker is
 * locked (see AccentPicker) rather than silently ignored, so the two settings never fight
 * each other. Not implemented (extracting a wallpaper palette needs a native module this
 * Expo config doesn't currently include) — the preference is wired end-to-end and persisted
 * so Settings can show the toggle and a "coming soon" state instead of the control not
 * existing at all; flip it on for real once that native piece lands. */
export async function loadDynamicColorPreference(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(DYNAMIC_COLOR_STORAGE_KEY);
  return stored === "true";
}

export async function saveDynamicColorPreference(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(DYNAMIC_COLOR_STORAGE_KEY, enabled ? "true" : "false");
}
