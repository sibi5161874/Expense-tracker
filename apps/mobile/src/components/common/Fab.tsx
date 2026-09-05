import type { ReactNode } from "react";
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { usePressScale } from "@/theme/usePressScale";

interface FabProps extends Omit<PressableProps, "style"> {
  icon: ReactNode;
  /** Extended FAB: a wider pill with a label next to the icon, vs. the default circular FAB. */
  label?: ReactNode;
  /** Plain style object only (not the per-press-state callback form Pressable also allows) —
   * this component already owns its own press feedback via usePressScale. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Primary floating action button — genuinely circular (a fixed-size square with
 * borderRadius = size / 2), not a 16dp-radius squircle. The original brief specified both
 * "circular" and "16dp radius" for this component in the same line, which are mutually
 * exclusive at a 56pt size; circular is the one every reference screenshot (Pix Wallpapers'
 * round blue FAB) actually shows.
 */
export function Fab({ icon, label, style, ...props }: FabProps) {
  const { theme } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  const size = 56;

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
            borderRadius: label ? size / 2 : size / 2,
            paddingHorizontal: label ? 20 : 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
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
