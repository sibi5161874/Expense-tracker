import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { motion } from "@/theme/tokens";
import { usePrefersReducedMotion } from "@/theme/usePrefersReducedMotion";

const bezier = Easing.bezier(motion.easeOut.x1, motion.easeOut.y1, motion.easeOut.x2, motion.easeOut.y2);

/**
 * Fade + rise entrance for one item in a freshly-rendered list, staggered by `index` per the
 * brief's list-stagger spec (30ms/item, capped at 8 — item 50 landing 1.5s after item 1 reads
 * as broken, not delightful). Runs once on mount; re-fetched/paginated data re-mounting the
 * same row (same `key`) will replay it, which is the desired effect for a freshly loaded page.
 * Skips straight to the settled state when the OS "Reduce Motion" setting is on.
 */
export function useStaggeredEntrance(index: number) {
  const progress = useRef(new Animated.Value(0)).current;
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    const delay = Math.min(index, motion.staggerMaxItems - 1) * motion.staggerDelayMs;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: motion.duration.slow,
      delay,
      easing: bezier,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [index, progress, reducedMotion]);

  return {
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };
}
