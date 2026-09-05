import type { ReactNode } from "react";
import { Animated, Platform, Pressable, type PressableProps } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { usePressScale } from "@/theme/usePressScale";

interface IconButtonProps extends Omit<PressableProps, "style" | "children"> {
  icon: ReactNode;
  /** Required, not optional — every icon-only control needs a spoken label since there's no
   * visible text to fall back to for screen readers. */
  accessibilityLabel: string;
}

/**
 * Bare icon button — always a 44x44pt touch target regardless of the icon's own visual
 * size (a 16px chevron still gets the full target), with Android's native ripple
 * (`android_ripple`, a no-op on iOS) plus the same press-and-lift scale as every other
 * pressable control in this app.
 */
export function IconButton({ icon, accessibilityLabel, ...props }: IconButtonProps) {
  const { theme } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
        onPressIn={(e) => {
          onPressIn();
          props.onPressIn?.(e);
        }}
        onPressOut={(e) => {
          onPressOut();
          props.onPressOut?.(e);
        }}
        android_ripple={
          Platform.OS === "android" ? { color: theme.mutedForeground, borderless: true, radius: 22 } : undefined
        }
        style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 }}
        {...props}
      >
        {icon}
      </Pressable>
    </Animated.View>
  );
}
