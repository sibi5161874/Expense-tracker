import { useColorScheme } from "nativewind";

/**
 * Same tokens as global.css, as resolved hex — for places that need a literal color string
 * (SVG icon `color` props, chart bar fills) rather than a NativeWind className, since RN's
 * style engine only resolves CSS vars through className, not through arbitrary prop values.
 */
export const colors = {
  light: {
    background: "#F8F9FA",
    foreground: "#1A1A1A",
    card: "#FFFFFF",
    primary: "#1976D2",
    mutedForeground: "#6B7280",
    accentForeground: "#1976D2",
    accent2: "#8E24AA",
    accent2Foreground: "#FFFFFF",
    destructive: "#D32F2F",
    success: "#239848",
    warning: "#e39f08",
    warningForeground: "#2f1e01",
    info: "#1976D2",
    border: "#E5E7EB",
    chart1: "#1976D2",
    chart2: "#8E24AA",
    chart3: "#a74a8c",
    chart4: "#3566b8",
    chart5: "#777068",
  },
  dark: {
    background: "#000000",
    foreground: "#FFFFFF",
    card: "#1A1A1A",
    primary: "#2196F3",
    mutedForeground: "#B0B0B0",
    accentForeground: "#64B5F6",
    accent2: "#9C27B0",
    accent2Foreground: "#FFFFFF",
    destructive: "#E53935",
    success: "#4bb866",
    warning: "#ecb33c",
    warningForeground: "#1f1401",
    info: "#2196F3",
    border: "#262626",
    chart1: "#2196F3",
    chart2: "#9C27B0",
    chart3: "#d272b4",
    chart4: "#588ee7",
    chart5: "#a39e94",
  },
} as const;

export type ColorToken = keyof typeof colors.light;

/**
 * Reads NativeWind's resolved color scheme (respects a manual light/dark/system override
 * via colorScheme.set(), not just the OS setting — see ThemeContext) rather than RN's raw
 * useColorScheme, which only ever reflects the OS and would drift out of sync with the
 * `dark:` classNames NativeWind is actually applying.
 */
export function useThemeColor(token: ColorToken): string {
  const { colorScheme } = useColorScheme();
  return colors[colorScheme === "dark" ? "dark" : "light"][token];
}

export function useChartPalette(): string[] {
  const { colorScheme } = useColorScheme();
  const c = colors[colorScheme === "dark" ? "dark" : "light"];
  return [c.chart1, c.chart2, c.chart3, c.chart4, c.chart5];
}
