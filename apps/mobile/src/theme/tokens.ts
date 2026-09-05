/**
 * PRISM OPS — canonical design tokens for apps/mobile ONLY.
 *
 * This intentionally breaks the previous "mirror apps/web's tokens exactly" rule (see the
 * old header comment in global.css) — a deliberate, confirmed decision, not an oversight.
 * apps/web is untouched; do not port these values back into apps/web/src/app/globals.css.
 *
 * Every numeric/color value used anywhere in apps/mobile should trace back to this file.
 * Nothing here is a lint-enforced rule (RN has no build-time token linter), so treat it as
 * the single reviewed source of truth: if a screen needs a color or size not listed here,
 * add it here first, then use it — don't inline a hex or a raw number in a component.
 */

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------
// A 4pt base unit with an 8pt rhythm from 8 upward — not a strict "8-point grid" (4 and 12
// both appear), naming it accurately here since a mislabeled grid is worse than an honest one.
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------
// Categorized by surface, not one blanket value — the previous tailwind.config.js used a
// single 16px ("rounded-2xl") for cards, buttons, AND inputs alike. Dialog and bottom sheet
// deliberately get different values (28 vs 24): a centered dialog reads as a more contained,
// "harder" object than a sheet that's anchored to the bottom edge, and treating them as one
// "modal" radius was the original brief contradicting itself between two sections.
export const radius = {
  card: 16,
  button: 12,
  chip: 12,
  toggle: 12,
  input: 20,
  bottomSheet: 24,
  dialog: 28,
  pill: 9999,
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
// Font: Inter (loaded via @expo-google-fonts/inter — see app/_layout.tsx's font-loading
// gate). Falls back to the OS default (Roboto/San Francisco) for the single frame before
// fonts finish loading, and forever if font loading ever fails — never a blank screen.
export const fontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

// size/lineHeight in px, weight maps to fontFamily above. Two sizes added versus the
// original brief (title, label) — H2 straight to Body left every card title and every
// button/chip label with no defined style of its own.
export const typography = {
  h1: { size: 32, lineHeight: 40, family: fontFamily.bold },
  h2: { size: 24, lineHeight: 32, family: fontFamily.semibold },
  title: { size: 20, lineHeight: 28, family: fontFamily.semibold },
  body: { size: 16, lineHeight: 24, family: fontFamily.regular },
  label: { size: 14, lineHeight: 20, family: fontFamily.medium },
  caption: { size: 12, lineHeight: 16, family: fontFamily.regular },
} as const;

/** RN's fontVariant for aligned digit columns — apply to every currency/amount Text. */
export const tabularNums = { fontVariant: ["tabular-nums"] as const };

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------
export const motion = {
  duration: {
    fast: 150, // page/route transitions
    base: 200, // chip fade, toggle thumb
    slow: 300,
  },
  /** Bottom sheet / dialog entrance. cubic-bezier(0.16, 1, 0.3, 1) as RN Bezier control points. */
  easeOut: { x1: 0.16, y1: 1, x2: 0.3, y2: 1 },
  /** Exit should not mirror entrance — a fast, linear-ish exit reads as snappier than a slow
   * ease-out played backwards, which is what the original brief's single-curve spec would
   * have produced. */
  easeIn: { x1: 0.4, y1: 0, x2: 1, y2: 1 },
  /** List stagger: 30ms per item, capped — uncapped, item 50 on a transaction list lands
   * 1.5s after item 1 and reads as broken, not delightful. */
  staggerDelayMs: 30,
  staggerMaxItems: 8,
  pressScale: 0.95,
} as const;

// ---------------------------------------------------------------------------
// Accent palette
// ---------------------------------------------------------------------------
// Each accent has a light-mode primary DISTINCT from its dark-mode primary. The original
// brief's hexes (e.g. Ocean #8AB4F8) were chosen for legibility as text/icons on a dark
// surface — every one of them fails WCAG 1.4.11's 3:1 UI-component contrast against a white
// light-mode background (Ocean measures ~2.1:1). Reusing them as a light-mode button fill
// would render as a barely-visible pastel shape. The dark-mode hexes are kept verbatim
// below; light-mode primaries are new, deliberately darker/more saturated variants of the
// same hue, chosen conservatively for contrast — spot-check with a real contrast tool before
// shipping, these are a reasoned first pass, not a colorimeter reading.
export type AccentKey = "ocean" | "mint" | "amber" | "peach" | "amethyst" | "inferno";

interface AccentDefinition {
  label: string;
  light: { primary: string; onPrimary: string; container: string; onContainer: string };
  dark: { primary: string; onPrimary: string; container: string; onContainer: string };
}

export const accents: Record<AccentKey, AccentDefinition> = {
  ocean: {
    label: "Ocean",
    light: { primary: "#1967D2", onPrimary: "#FFFFFF", container: "#D3E3FD", onContainer: "#0B3D91" },
    dark: { primary: "#8AB4F8", onPrimary: "#1A1A1A", container: "#1E3A5F", onContainer: "#D3E3FD" },
  },
  mint: {
    label: "Mint",
    light: { primary: "#0E8F5F", onPrimary: "#FFFFFF", container: "#D4F5E6", onContainer: "#0B4A32" },
    dark: { primary: "#73D6B0", onPrimary: "#1A1A1A", container: "#1E4A3A", onContainer: "#D4F5E6" },
  },
  amber: {
    label: "Amber",
    light: { primary: "#8A6600", onPrimary: "#FFFFFF", container: "#FCE8B8", onContainer: "#4A3800" },
    dark: { primary: "#F6C344", onPrimary: "#1A1A1A", container: "#3D3311", onContainer: "#FCE8B8" },
  },
  peach: {
    label: "Peach",
    light: { primary: "#B3492E", onPrimary: "#FFFFFF", container: "#FBDAD0", onContainer: "#5C2415" },
    dark: { primary: "#F8B4A0", onPrimary: "#1A1A1A", container: "#4A2A20", onContainer: "#FBDAD0" },
  },
  amethyst: {
    label: "Amethyst",
    light: { primary: "#6A3FC0", onPrimary: "#FFFFFF", container: "#E7DCFC", onContainer: "#3A2560" },
    dark: { primary: "#C0A6F8", onPrimary: "#1A1A1A", container: "#3A2A60", onContainer: "#E7DCFC" },
  },
  inferno: {
    label: "Inferno",
    light: { primary: "#C1362A", onPrimary: "#FFFFFF", container: "#FBDAD5", onContainer: "#611F17" },
    dark: { primary: "#F87866", onPrimary: "#1A1A1A", container: "#4A2020", onContainer: "#FBDAD5" },
  },
};

export const DEFAULT_ACCENT: AccentKey = "ocean";

// ---------------------------------------------------------------------------
// Semantic colors — intentionally NEVER derived from the selected accent
// ---------------------------------------------------------------------------
// If these were tied to the user's accent choice, picking "Mint" would make every primary
// button read as "income" and picking "Inferno" would make every primary action read as
// "expense" — a real collision this app can't afford, since green/red already mean
// income/expense throughout the transaction and budget screens.
export const semantic = {
  light: {
    success: "#239848",
    successForeground: "#F7FEF8",
    successSubtle: "#DBF8DE",
    warning: "#B5790A",
    warningForeground: "#2F1E01",
    warningSubtle: "#FFF0CC",
    destructive: "#D32F2F",
    destructiveForeground: "#FFFFFF",
    destructiveSubtle: "#FDECEA",
    info: "#1976D2",
    infoForeground: "#FFFFFF",
    infoSubtle: "#E3F2FD",
  },
  dark: {
    success: "#4BB866",
    successForeground: "#030C04",
    successSubtle: "#0C3116",
    warning: "#ECB33C",
    warningForeground: "#1F1401",
    warningSubtle: "#3A2B07",
    destructive: "#E53935",
    destructiveForeground: "#FFFFFF",
    destructiveSubtle: "#3A1414",
    info: "#2196F3",
    infoForeground: "#FFFFFF",
    infoSubtle: "#0D2A44",
  },
} as const;

// ---------------------------------------------------------------------------
// Neutral surfaces — three tiers: light, dark, amoled
// ---------------------------------------------------------------------------
// AMOLED is modeled as a *variant of dark* (a "Use pure black" toggle, same pattern as the
// reference AirPlay screenshot's own "Use Black" switch) rather than a third NativeWind
// color-scheme class — dark's own text/border/semantic tokens carry over unchanged, only
// background/card/border get swapped to their AMOLED-specific values.
export const neutrals = {
  light: {
    background: "#F4F5F7",
    card: "#FFFFFF",
    foreground: "#1A1A1A",
    mutedForeground: "#5B6472",
    // Cards/chips/inputs all need a visible 1px edge against a near-white background —
    // the original brief never defined this token despite requiring it everywhere.
    border: "#DDE1E6",
  },
  dark: {
    background: "#121212",
    card: "#1E1E1E",
    foreground: "#E6E6E6",
    mutedForeground: "#A8ADB4",
    border: "#2E2E2E",
  },
  // #1E1E1E-on-#121212 (dark) has enough separation to read as elevation; #0D0D0D-on-#000000
  // (the brief's literal AMOLED values) measures ~1.08:1 — functionally invisible. The border
  // below is the ONLY thing separating a card from the page in this mode, so it's brighter
  // than dark mode's, not the same value reused.
  amoled: {
    background: "#000000",
    card: "#0D0D0D",
    foreground: "#E6E6E6",
    mutedForeground: "#A8ADB4",
    border: "#242424",
  },
} as const;

export type ThemeMode = "light" | "dark";
