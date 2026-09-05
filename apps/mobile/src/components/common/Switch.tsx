import { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { motion } from "@/theme/tokens";

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;
const THUMB_INSET = 3;

/**
 * Custom pill switch rather than RN's built-in <Switch> — the built-in component renders
 * natively per-platform (a very different shape on iOS vs Android) and can't be given the
 * "outlined when off, solid accent-filled with a white thumb when on" look consistently on
 * both. Pure Animated (core RN), 200ms ease thumb travel + track-color crossfade.
 */
export function Switch({ value, onValueChange, disabled }: SwitchProps) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: motion.duration.base, useNativeDriver: false }).start();
  }, [value, anim]);

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", theme.primary],
  });
  const thumbTranslate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      // 44x48pt touch target even though the visible track is smaller — hitSlop expands the
      // pressable area without changing the drawn pill's size.
      hitSlop={10}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          backgroundColor: trackColor,
          borderWidth: value ? 0 : 1.5,
          borderColor: theme.mutedForeground,
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            // Brief: "ON: solid Primary with a white thumb" — always white on, regardless of
            // which on-primary text color the accent uses elsewhere.
            backgroundColor: value ? "#FFFFFF" : theme.mutedForeground,
            marginLeft: THUMB_INSET,
            transform: [{ translateX: thumbTranslate }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
