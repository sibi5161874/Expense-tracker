import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveThemePreference, THEME_PREFERENCE_STORAGE_KEY, type ThemePreference } from "@/lib/themePreference";

/** Drives the Light/Dark/System picker in Settings. Separate from NativeWind's own
 * useColorScheme() because that hook only ever reports the *resolved* "light" | "dark" —
 * when the user picked "System", there's nothing there to tell the UI that's what's
 * selected, so the raw preference is tracked here instead. */
export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark") setPreferenceState(stored);
      setLoaded(true);
    });
  }, []);

  async function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    await saveThemePreference(next);
  }

  return { preference, setPreference, loaded };
}
