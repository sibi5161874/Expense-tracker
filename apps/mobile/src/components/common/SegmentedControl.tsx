import { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, Pressable, View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/cn";

export interface SegmentedControlOption {
  value: string;
  label: string;
}

/**
 * Material 3 Animated Segmented Button Component with smooth spring sliding active pill.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { theme } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const activeIndex = options.findIndex((o) => o.value === value);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const numOptions = options.length || 1;
  const segmentWidth = containerWidth > 0 ? (containerWidth - 8) / numOptions : 0;

  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (segmentWidth > 0) {
      Animated.spring(translateX, {
        toValue: safeIndex * segmentWidth,
        tension: 68,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [safeIndex, segmentWidth, translateX]);

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}
      className="flex-row items-center rounded-full border p-1"
      style={{
        borderColor: theme.outlineVariant ? `${theme.outlineVariant}66` : theme.border,
        backgroundColor: theme.surfaceContainer || "transparent",
        position: "relative",
      }}
    >
      {/* Sliding Pill Indicator */}
      {segmentWidth > 0 && (
        <Animated.View
          style={{
            position: "absolute",
            left: 4,
            top: 4,
            bottom: 4,
            width: segmentWidth,
            borderRadius: 999,
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 3,
            transform: [{ translateX }],
          }}
        />
      )}

      {options.map((option, idx) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className="flex-1 items-center justify-center rounded-full py-2 px-3 z-10"
          >
            <AppText
              className="text-xs tracking-wide"
              style={{
                color: active
                  ? theme.onPrimary || "#ffffff"
                  : theme.mutedForeground,
                fontWeight: active ? "700" : "500",
              }}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
