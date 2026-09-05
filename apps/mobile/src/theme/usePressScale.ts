import { useRef } from "react";
import { Animated } from "react-native";
import { motion } from "@/theme/tokens";
import { usePrefersReducedMotion } from "@/theme/usePrefersReducedMotion";

/**
 * "Press and lift" — scales to motion.pressScale (0.95) on press-in, springs back on
 * press-out/cancel. Built on RN's core Animated API rather than react-native-reanimated
 * (not a dependency of this project) — spring-based scale doesn't need worklets to feel
 * good, and this avoids adding a new native module this late.
 */
export function usePressScale() {
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = usePrefersReducedMotion();

  function onPressIn() {
    if (reducedMotion) return;
    Animated.spring(scale, {
      toValue: motion.pressScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function onPressOut() {
    if (reducedMotion) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  }

  return { animatedStyle: { transform: [{ scale }] }, onPressIn, onPressOut };
}
