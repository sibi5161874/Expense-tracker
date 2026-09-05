import { View, type ViewProps } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/cn";

/**
 * rounded-card (16dp, theme/tokens.ts `radius.card`) + a 1px border in every mode — added
 * versus the previous card/background-contrast-only approach specifically for AMOLED: card
 * #0D0D0D on background #000000 measures ~1.08:1, functionally invisible without a border to
 * actually separate the two. Light/dark additionally get a soft shadow (elevation on
 * Android); AMOLED gets none — a shadow implies a light source, which reads as wrong on a
 * screen otherwise committed to true black.
 */
export function Card({ className, style, ...props }: ViewProps & { className?: string }) {
  const { theme } = useTheme();

  return (
    <View
      className={cn("rounded-card bg-card p-4", className)}
      style={[
        { borderWidth: 1, borderColor: theme.border },
        !theme.amoled && {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: theme.mode === "dark" ? 0.4 : 0.08,
          shadowRadius: 3,
          elevation: 2,
        },
        style,
      ]}
      {...props}
    />
  );
}
