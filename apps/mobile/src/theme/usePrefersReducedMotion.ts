import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Mirrors the OS-level "Reduce Motion" accessibility setting (Settings > Accessibility on
 * iOS, Settings > Accessibility > Remove animations on Android) — RN has no CSS-style
 * `prefers-reduced-motion` media query, so every decorative Animated usage in this app
 * (press-scale, list stagger, chip/switch crossfade, sheet/dialog entrance) reads this
 * instead of assuming motion is always wanted.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduced(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
