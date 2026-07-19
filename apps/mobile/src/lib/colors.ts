import { useColorScheme } from "react-native";

/**
 * Same tokens as global.css, as resolved hex — for places that need a literal color string
 * (SVG icon `color` props, chart bar fills) rather than a NativeWind className, since RN's
 * style engine only resolves CSS vars through className, not through arbitrary prop values.
 */
export const colors = {
  light: {
    background: "#fbf8f3",
    foreground: "#191510",
    card: "#fffdfa",
    primary: "#a76200",
    mutedForeground: "#67635d",
    accentForeground: "#4a2b00",
    destructive: "#da2a32",
    success: "#239848",
    warning: "#e39f08",
    warningForeground: "#2f1e01",
    info: "#0089d0",
    border: "#e0ded9",
    chart1: "#a76200",
    chart2: "#008585",
    chart3: "#a74a8c",
    chart4: "#3566b8",
    chart5: "#777068",
  },
  dark: {
    background: "#100d08",
    foreground: "#f1eee9",
    card: "#191510",
    primary: "#d58d25",
    mutedForeground: "#95928b",
    accentForeground: "#f5d9bb",
    destructive: "#ff6367",
    success: "#4bb866",
    warning: "#ecb33c",
    warningForeground: "#1f1401",
    info: "#36a2e3",
    border: "#282321",
    chart1: "#d58d25",
    chart2: "#09aeae",
    chart3: "#d272b4",
    chart4: "#588ee7",
    chart5: "#a39e94",
  },
} as const;

export type ColorToken = keyof typeof colors.light;

export function useThemeColor(token: ColorToken): string {
  const scheme = useColorScheme();
  return colors[scheme === "dark" ? "dark" : "light"][token];
}

export function useChartPalette(): string[] {
  const scheme = useColorScheme();
  const c = colors[scheme === "dark" ? "dark" : "light"];
  return [c.chart1, c.chart2, c.chart3, c.chart4, c.chart5];
}
