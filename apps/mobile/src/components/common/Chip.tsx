import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Pressable } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily, motion } from "@/theme/tokens";

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ReactNode;
}

/**
 * Material 3 Chip Component.
 * - Height: 32dp (compact & accessible).
 * - Radius: 8dp (`rounded-lg`).
 * - Unselected: 1px outline-variant border with transparent fill.
 * - Selected: Solid primaryContainer fill with onPrimaryContainer text.
 * - Smooth 200ms container crossfade.
 */
export function Chip({ label, selected, onPress, icon }: ChipProps) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: selected ? 1 : 0,
      duration: motion.duration.base,
      useNativeDriver: false,
    }).start();
  }, [selected, anim]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", theme.primaryContainer || theme.secondaryContainer],
  });

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      theme.outlineVariant || theme.border,
      theme.primaryContainer || theme.secondaryContainer,
    ],
  });

  const textColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.foreground, theme.onPrimaryContainer || theme.primary],
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="h-8 min-h-[32px] flex-row items-center gap-1.5 rounded-lg px-3"
      style={{ borderWidth: 1, borderColor: "transparent" }}
    >
      <Animated.View
        pointerEvents="none"
        className="absolute inset-0 rounded-lg"
        style={{ backgroundColor, borderWidth: 1, borderColor }}
      />
      {icon}
      <Animated.Text
        style={{
          color: textColor,
          fontFamily: fontFamily.medium,
          fontSize: 13,
          letterSpacing: 0.1,
        }}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}
