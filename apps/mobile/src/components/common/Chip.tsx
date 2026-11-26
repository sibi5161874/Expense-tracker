import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ReactNode;
  activeColor?: string;
  activeTextColor?: string;
}

/**
 * Material 3 Filter Chip Component.
 * - Solid high-contrast active styling with unmistakable vibrant background.
 * - Inactive state with crisp border and high-contrast foreground text.
 * - Guaranteed cross-platform text visibility on both mobile devices and React Native Web.
 */
export function Chip({
  label,
  selected,
  onPress,
  icon,
  activeColor,
  activeTextColor,
}: ChipProps) {
  const { theme } = useTheme();

  const activeBg = activeColor || theme.primary;
  const activeBorder = activeColor || theme.primary;
  const activeText = activeTextColor || theme.onPrimary || "#ffffff";

  const inactiveBg = theme.surfaceContainerLow || theme.card;
  const inactiveBorder = theme.outlineVariant ? `${theme.outlineVariant}55` : theme.border;
  const inactiveText = theme.foreground;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="h-9 min-h-[36px] flex-row items-center gap-1.5 rounded-full px-4 border"
      style={{
        backgroundColor: selected ? activeBg : inactiveBg,
        borderColor: selected ? activeBorder : inactiveBorder,
        shadowColor: selected ? activeBg : "transparent",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: selected ? 0.25 : 0,
        shadowRadius: 3,
        elevation: selected ? 2 : 0,
      }}
    >
      {icon}
      <AppText
        className="text-xs tracking-wide"
        style={{
          color: selected ? activeText : inactiveText,
          fontWeight: selected ? "700" : "600",
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
