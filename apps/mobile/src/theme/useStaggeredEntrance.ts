import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { m3Motion } from "@/theme/tokens";
import { usePrefersReducedMotion } from "@/theme/usePrefersReducedMotion";

const m3EntranceBezier = Easing.bezier(
  m3Motion.easing.emphasizedDecelerate.x1,
  m3Motion.easing.emphasizedDecelerate.y1,
  m3Motion.easing.emphasizedDecelerate.x2,
  m3Motion.easing.emphasizedDecelerate.y2
);

/**
 * Material 3 Staggered Entrance Animation.
 * Fade + rise entrance staggered by `index` using M3 Emphasized Decelerate curve.
 * 30ms interval capped at 8 items.
 */
export function useStaggeredEntrance(index: number) {
  const progress = useRef(new Animated.Value(0)).current;
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    const delay = Math.min(index, 7) * 30;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: m3Motion.duration.medium2,
      delay,
      easing: m3EntranceBezier,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [index, progress, reducedMotion]);

  return {
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };
}
