import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { View } from "react-native";
import { useColorScheme, vars } from "nativewind";
import {
  accents,
  neutrals,
  semantic,
  DEFAULT_ACCENT,
  type AccentKey,
  type ThemeMode,
} from "@/theme/tokens";
import {
  loadAmoledPreference,
  saveAmoledPreference,
  loadAccentPreference,
  saveAccentPreference,
  loadDynamicColorPreference,
  saveDynamicColorPreference,
} from "@/lib/themePreference";

/** Every token a screen should ever need at runtime, pre-resolved for the current
 * mode + amoled + accent combination — nothing downstream re-derives colors itself. */
export interface ResolvedTheme {
  mode: ThemeMode;
  amoled: boolean;
  accent: AccentKey;
  dynamicColor: boolean;
  background: string;
  card: string;
  foreground: string;
  mutedForeground: string;
  border: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  success: string;
  successForeground: string;
  successSubtle: string;
  warning: string;
  warningForeground: string;
  warningSubtle: string;
  destructive: string;
  destructiveForeground: string;
  destructiveSubtle: string;
  info: string;
  infoForeground: string;
  infoSubtle: string;
}

interface ThemeContextValue {
  theme: ResolvedTheme;
  loaded: boolean;
  setAmoled: (enabled: boolean) => Promise<void>;
  setAccent: (accent: AccentKey) => Promise<void>;
  setDynamicColor: (enabled: boolean) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** "#RRGGBB" -> "R G B", the space-separated triplet format global.css's withOpacity()
 * helper expects inside rgb(var(--x) / <alpha-value>). */
function hexToTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function resolveTheme(mode: ThemeMode, amoled: boolean, accent: AccentKey, dynamicColor: boolean): ResolvedTheme {
  const n = mode === "dark" && amoled ? neutrals.amoled : neutrals[mode];
  const s = semantic[mode];
  const a = accents[accent][mode];
  return {
    mode,
    amoled,
    accent,
    dynamicColor,
    background: n.background,
    card: n.card,
    foreground: n.foreground,
    mutedForeground: n.mutedForeground,
    border: n.border,
    primary: a.primary,
    onPrimary: a.onPrimary,
    primaryContainer: a.container,
    onPrimaryContainer: a.onContainer,
    success: s.success,
    successForeground: s.successForeground,
    successSubtle: s.successSubtle,
    warning: s.warning,
    warningForeground: s.warningForeground,
    warningSubtle: s.warningSubtle,
    destructive: s.destructive,
    destructiveForeground: s.destructiveForeground,
    destructiveSubtle: s.destructiveSubtle,
    info: s.info,
    infoForeground: s.infoForeground,
    infoSubtle: s.infoSubtle,
  };
}

/**
 * Wraps the app (mount once, in app/_layout.tsx, inside SafeAreaProvider) and resolves
 * mode/amoled/accent/dynamicColor into one flat ResolvedTheme via useTheme(). NativeWind's
 * own `dark:` classNames keep working independently (colorScheme is still driven by
 * loadThemePreference/saveThemePreference as before) — this provider is additive, for the
 * PRISM OPS token layer specifically, not a replacement for the existing light/dark plumbing.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme } = useColorScheme();
  const mode: ThemeMode = colorScheme === "dark" ? "dark" : "light";

  const [amoled, setAmoledState] = useState(false);
  const [accent, setAccentState] = useState<AccentKey>(DEFAULT_ACCENT);
  const [dynamicColor, setDynamicColorState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadAmoledPreference(), loadAccentPreference(), loadDynamicColorPreference()]).then(
      ([amoledPref, accentPref, dynamicPref]) => {
        setAmoledState(amoledPref);
        setAccentState(accentPref);
        setDynamicColorState(dynamicPref);
        setLoaded(true);
      }
    );
  }, []);

  async function setAmoled(enabled: boolean) {
    setAmoledState(enabled);
    await saveAmoledPreference(enabled);
  }

  async function setAccent(next: AccentKey) {
    setAccentState(next);
    await saveAccentPreference(next);
  }

  async function setDynamicColor(enabled: boolean) {
    setDynamicColorState(enabled);
    await saveDynamicColorPreference(enabled);
  }

  const theme = useMemo(
    () => resolveTheme(mode, amoled, accent, dynamicColor),
    [mode, amoled, accent, dynamicColor]
  );

  // Also pushes the resolved accent (and AMOLED's background/card/border) into NativeWind's
  // CSS vars via vars() — so existing `bg-primary`/`text-primary`/etc classNames across
  // already-written screens pick up the selected accent immediately too, not just new code
  // written against useTheme() directly. Wrapping in a single flex-1 View costs nothing
  // layout-wise (vars() only needs *a* node in the tree to attach the override to).
  const cssVarOverrides = useMemo(
    () =>
      vars({
        "--primary": hexToTriplet(theme.primary),
        "--primary-foreground": hexToTriplet(theme.onPrimary),
        "--accent": hexToTriplet(theme.primaryContainer),
        "--accent-foreground": hexToTriplet(theme.onPrimaryContainer),
        "--background": hexToTriplet(theme.background),
        "--card": hexToTriplet(theme.card),
        "--card-foreground": hexToTriplet(theme.foreground),
        "--foreground": hexToTriplet(theme.foreground),
        "--muted-foreground": hexToTriplet(theme.mutedForeground),
        "--border": hexToTriplet(theme.border),
      }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={{ theme, loaded, setAmoled, setAccent, setDynamicColor }}>
      <View style={[{ flex: 1 }, cssVarOverrides]}>{children}</View>
    </ThemeContext.Provider>
  );
}

const DEFAULT_THEME: ResolvedTheme = resolveTheme("dark", false, DEFAULT_ACCENT, false);

const defaultThemeContextValue: ThemeContextValue = {
  theme: DEFAULT_THEME,
  loaded: true,
  setAmoled: async () => {},
  setAccent: async () => {},
  setDynamicColor: async () => {},
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return defaultThemeContextValue;
  }
  return ctx;
}

