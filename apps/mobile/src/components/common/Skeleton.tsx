import { useEffect, useRef } from "react";
import { Animated, type ViewStyle } from "react-native";
import { cn } from "@/lib/cn";

/** Mirrors apps/web/src/components/ui/skeleton.tsx's animate-pulse, via RN's Animated (no extra dependency). */
export function Skeleton({ className, style }: { className?: string; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ opacity }, style]} className={cn("rounded-md bg-muted", className)} />;
}
