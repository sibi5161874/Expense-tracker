import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Pressable } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily, motion } from "@/theme/tokens";

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ReactNode;
}

/**
 * Selector chip — the pattern behind any "pick one of N" row (report ranges, mapping
 * suggestions, filters). Unselected: 1px neutral border, no fill. Selected: solid
 * Primary Container fill + on-container text, no border. 200ms crossfade between the two
 * rather than an instant swap. min-height 36pt per spec; width is intrinsic to the label.
 */
export function Chip({ label, selected, onPress, icon }: ChipProps) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: selected ? 1 : 0, duration: motion.duration.base, useNativeDriver: false }).start();
  }, [selected, anim]);

  const backgroundColor = anim.interpolate({ inputRange: [0, 1], outputRange: ["transparent", theme.primaryContainer] });
  const borderColor = anim.interpolate({ inputRange: [0, 1], outputRange: [theme.border, theme.primaryContainer] });
  const textColor = anim.interpolate({
    // Animated can't interpolate arbitrary hex-to-hex color pairs reliably across every
    // possible accent, so text color snaps rather than crossfades — only the container
    // fade is animated. Good enough: the label swap reads as instant either way since it's
    // a small area compared to the chip's own fill transition.
    inputRange: [0, 1],
    outputRange: [theme.mutedForeground, theme.onPrimaryContainer],
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="min-h-9 flex-row items-center gap-1.5 rounded-chip px-3.5"
      style={{ borderWidth: 1 }}
    >
      <Animated.View
        pointerEvents="none"
        className="absolute inset-0 rounded-chip"
        style={{ backgroundColor, borderWidth: 1, borderColor }}
      />
      {icon}
      <Animated.Text style={{ color: textColor, fontFamily: fontFamily.medium, fontSize: 14 }}>{label}</Animated.Text>
    </Pressable>
  );
}
