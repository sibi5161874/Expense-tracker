import { View, type ViewProps } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/cn";

export type CardVariant = "elevated" | "filled" | "outlined";

interface CardProps extends ViewProps {
  variant?: CardVariant;
  className?: string;
}

/**
 * Material 3 Card Component.
 * - Elevated: Resting at Elevation Level 1 with subtle shadow & border in dark/AMOLED.
 * - Filled: Resting on surface-container-highest with no shadow.
 * - Outlined: Clean outline-variant border on surface with no shadow.
 * - Standard 16dp radius (`rounded-2xl`).
 */
export function Card({
  variant = "elevated",
  className,
  style,
  ...props
}: CardProps) {
  const { theme } = useTheme();

  const isElevated = variant === "elevated";
  const isFilled = variant === "filled";
  const isOutlined = variant === "outlined";

  return (
    <View
      className={cn(
        "rounded-2xl p-4",
        isElevated && "bg-card",
        isFilled && "bg-surface-container-highest",
        isOutlined && "bg-card border border-outline-variant/60",
        className
      )}
      style={[
        isElevated && {
          borderWidth: 1,
          borderColor: theme.border,
          ...(!theme.amoled && {
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: theme.mode === "dark" ? 0.35 : 0.08,
            shadowRadius: 4,
            elevation: 2,
          }),
        },
        isFilled && {
          backgroundColor: theme.surfaceContainerHighest || theme.card,
        },
        isOutlined && {
          borderColor: theme.outlineVariant ? `${theme.outlineVariant}66` : theme.border,
        },
        style,
      ]}
      {...props}
    />
  );
}
