import type { ReactNode } from "react";
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { usePressScale } from "@/theme/usePressScale";

type FabVariant = "primary" | "surface" | "tonal";

interface FabProps extends Omit<PressableProps, "style"> {
  icon: ReactNode;
  /** Extended FAB: pill with label next to icon */
  label?: ReactNode;
  variant?: FabVariant;
  style?: StyleProp<ViewStyle>;
}

/**
 * Material 3 Floating Action Button (FAB).
 * - Standard FAB: 56x56dp with 16dp radius (`rounded-2xl`).
 * - Extended FAB: 56dp height with pill shape (`rounded-full`) and horizontal padding.
 * - Elevation Level 3 resting with spring press scale.
 * - Variants: Primary, Surface, and Tonal.
 */
export function Fab({
  icon,
  label,
  variant = "primary",
  style,
  ...props
}: FabProps) {
  const { theme } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.94);
  const size = 56;

  const backgroundColor =
    variant === "surface"
      ? theme.surfaceContainerHigh || theme.card
      : variant === "tonal"
        ? theme.primaryContainer
        : theme.primary;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={(e) => {
          onPressIn();
          props.onPressIn?.(e);
        }}
        onPressOut={(e) => {
          onPressOut();
          props.onPressOut?.(e);
        }}
        style={[
          {
            height: size,
            minWidth: size,
            borderRadius: label ? 28 : 16,
            paddingHorizontal: label ? 20 : 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: theme.mode === "dark" ? 0.45 : 0.22,
            shadowRadius: 10,
            elevation: 6,
          },
          style,
        ]}
        {...props}
      >
        {icon}
        {label}
      </Pressable>
    </Animated.View>
  );
}
