import { useTheme } from "@/theme/ThemeProvider";

/**
 * Resolved-hex color access for places that need a literal color string (SVG icon `color`
 * props, chart bar fills) rather than a NativeWind className, since RN's style engine only
 * resolves CSS vars through className, not through arbitrary prop values.
 *
 * Now backed by ThemeProvider's resolved theme (mode + AMOLED + accent), not a static
 * light/dark object — `useThemeColor("primary")` returns whatever accent the user picked,
 * not a fixed blue. Kept as a token-name-in, hex-out hook so existing call sites (written
 * against the old two-tier colors.light/colors.dark shape) don't need to change.
 */
export type ColorToken =
  | "background"
  | "foreground"
  | "card"
  | "primary"
  | "mutedForeground"
  | "accentForeground"
  | "accent2"
  | "accent2Foreground"
  | "destructive"
  | "success"
  | "warning"
  | "warningForeground"
  | "info"
  | "border"
  | "chart1"
  | "chart2"
  | "chart3"
  | "chart4"
  | "chart5";

// accent2 and the chart palette are decorative/secondary — deliberately NOT tied to the
// user's chosen PRISM OPS accent (that accent is reserved for primary actions/selection
// state only; see tokens.ts's semantic-colors comment for the same reasoning applied to
// success/destructive). Fixed per mode, same values as before this refactor.
const fixed = {
  light: {
    accent2: "#8E24AA",
    accent2Foreground: "#FFFFFF",
    chart1: "#1976D2",
    chart2: "#8E24AA",
    chart3: "#A74A8C",
    chart4: "#3566B8",
    chart5: "#777068",
  },
  dark: {
    accent2: "#9C27B0",
    accent2Foreground: "#FFFFFF",
    chart1: "#2196F3",
    chart2: "#9C27B0",
    chart3: "#D272B4",
    chart4: "#588EE7",
    chart5: "#A39E94",
  },
} as const;

export function useThemeColor(token: ColorToken): string {
  const { theme } = useTheme();
  const f = fixed[theme.mode];
  switch (token) {
    case "background":
      return theme.background;
    case "foreground":
      return theme.foreground;
    case "card":
      return theme.card;
    case "primary":
    case "accentForeground":
      return theme.primary;
    case "mutedForeground":
      return theme.mutedForeground;
    case "destructive":
      return theme.destructive;
    case "success":
      return theme.success;
    case "warning":
      return theme.warning;
    case "warningForeground":
      return theme.warningForeground;
    case "info":
      return theme.info;
    case "border":
      return theme.border;
    case "accent2":
      return f.accent2;
    case "accent2Foreground":
      return f.accent2Foreground;
    case "chart1":
      return f.chart1;
    case "chart2":
      return f.chart2;
    case "chart3":
      return f.chart3;
    case "chart4":
      return f.chart4;
    case "chart5":
      return f.chart5;
  }
}

export function useChartPalette(): string[] {
  const { theme } = useTheme();
  const f = fixed[theme.mode];
  return [f.chart1, f.chart2, f.chart3, f.chart4, f.chart5];
}
