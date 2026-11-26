import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform, View } from "react-native";
import { useColorScheme, vars } from "nativewind";
import {
  accents,
  neutrals,
  semantic,
  m3Surfaces,
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
  secondaryContainer: string;
  onSecondaryContainer: string;
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
  /* Material 3 (M3) Surface & Outline Tokens */
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
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
  const m = mode === "dark" && amoled ? m3Surfaces.amoled : m3Surfaces[mode];
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
    secondaryContainer: a.container,
    onSecondaryContainer: a.onContainer,
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
    surfaceContainerLowest: m.surfaceContainerLowest,
    surfaceContainerLow: m.surfaceContainerLow,
    surfaceContainer: m.surfaceContainer,
    surfaceContainerHigh: m.surfaceContainerHigh,
    surfaceContainerHighest: m.surfaceContainerHighest,
    onSurface: m.onSurface,
    onSurfaceVariant: m.onSurfaceVariant,
    outline: m.outline,
    outlineVariant: m.outlineVariant,
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

  // Synchronize CSS variables and dark class to document root on Web so that portaled
  // modals, dropdowns, and sheets automatically inherit all color tokens, and enforce
  // solid theme background on document/body to eradicate white flash during screen transitions.
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const root = document.documentElement;
      if (mode === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      root.style.backgroundColor = theme.background;
      if (document.body) {
        document.body.style.backgroundColor = theme.background;
      }
      root.style.setProperty("--background", hexToTriplet(theme.background));
      root.style.setProperty("--card", hexToTriplet(theme.card));
      root.style.setProperty("--card-foreground", hexToTriplet(theme.foreground));
      root.style.setProperty("--foreground", hexToTriplet(theme.foreground));
      root.style.setProperty("--muted-foreground", hexToTriplet(theme.mutedForeground));
      root.style.setProperty("--border", hexToTriplet(theme.border));
      root.style.setProperty("--primary", hexToTriplet(theme.primary));
      root.style.setProperty("--primary-foreground", hexToTriplet(theme.onPrimary));
      root.style.setProperty("--accent", hexToTriplet(theme.primaryContainer));
      root.style.setProperty("--accent-foreground", hexToTriplet(theme.onPrimaryContainer));
      root.style.setProperty("--surface-container-lowest", hexToTriplet(theme.surfaceContainerLowest));
      root.style.setProperty("--surface-container-low", hexToTriplet(theme.surfaceContainerLow));
      root.style.setProperty("--surface-container", hexToTriplet(theme.surfaceContainer));
      root.style.setProperty("--surface-container-high", hexToTriplet(theme.surfaceContainerHigh));
      root.style.setProperty("--surface-container-highest", hexToTriplet(theme.surfaceContainerHighest));
      root.style.setProperty("--on-surface", hexToTriplet(theme.onSurface));
      root.style.setProperty("--on-surface-variant", hexToTriplet(theme.onSurfaceVariant));
      root.style.setProperty("--outline", hexToTriplet(theme.outline));
      root.style.setProperty("--outline-variant", hexToTriplet(theme.outlineVariant));
      root.style.setProperty("--primary-container", hexToTriplet(theme.primaryContainer));
      root.style.setProperty("--on-primary-container", hexToTriplet(theme.onPrimaryContainer));
      root.style.setProperty("--secondary-container", hexToTriplet(theme.secondaryContainer));
      root.style.setProperty("--on-secondary-container", hexToTriplet(theme.onSecondaryContainer));
    }
  }, [theme, mode]);

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
        // Material 3 (M3) Surface & Container Variables
        "--surface-container-lowest": hexToTriplet(theme.surfaceContainerLowest),
        "--surface-container-low": hexToTriplet(theme.surfaceContainerLow),
        "--surface-container": hexToTriplet(theme.surfaceContainer),
        "--surface-container-high": hexToTriplet(theme.surfaceContainerHigh),
        "--surface-container-highest": hexToTriplet(theme.surfaceContainerHighest),
        "--on-surface": hexToTriplet(theme.onSurface),
        "--on-surface-variant": hexToTriplet(theme.onSurfaceVariant),
        "--outline": hexToTriplet(theme.outline),
        "--outline-variant": hexToTriplet(theme.outlineVariant),
        "--primary-container": hexToTriplet(theme.primaryContainer),
        "--on-primary-container": hexToTriplet(theme.onPrimaryContainer),
        "--secondary-container": hexToTriplet(theme.secondaryContainer),
        "--on-secondary-container": hexToTriplet(theme.onSecondaryContainer),
      }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={{ theme, loaded, setAmoled, setAccent, setDynamicColor }}>
      <View style={[{ flex: 1, backgroundColor: theme.background }, cssVarOverrides]}>{children}</View>
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

