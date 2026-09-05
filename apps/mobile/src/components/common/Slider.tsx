import { useMemo, useRef, useState } from "react";
import { PanResponder, View, type LayoutChangeEvent } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface SliderProps {
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
  step?: number;
}

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 4;

/**
 * Built on core RN's PanResponder rather than @react-native-community/slider — this project
 * doesn't currently depend on it, and adding a native module this late in a session that's
 * already hit several install/build fragility issues wasn't worth the risk for one control.
 * Heavily padded per spec: the touchable area is the full component height (24pt thumb +
 * generous vertical padding), not just the 4pt track line, so a real finger can hit it.
 */
export function Slider({ value, min, max, onValueChange, step = 1 }: SliderProps) {
  const { theme } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);

  const clampedFraction = useMemo(() => {
    const range = max - min;
    return range === 0 ? 0 : Math.min(1, Math.max(0, (value - min) / range));
  }, [value, min, max]);

  function handleLayout(e: LayoutChangeEvent) {
    const width = e.nativeEvent.layout.width - THUMB_SIZE;
    trackWidthRef.current = width;
    setTrackWidth(width);
  }

  function valueFromLocalX(localX: number): number {
    const fraction = Math.min(1, Math.max(0, localX / trackWidthRef.current));
    const raw = min + fraction * (max - min);
    const stepped = Math.round(raw / step) * step;
    return Math.min(max, Math.max(min, stepped));
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, gestureState) => {
        const localX = gestureState.moveX - gestureState.x0 + clampedFraction * trackWidthRef.current;
        onValueChange(valueFromLocalX(localX));
      },
      onPanResponderGrant: (evt) => {
        onValueChange(valueFromLocalX(evt.nativeEvent.locationX - THUMB_SIZE / 2));
      },
    })
  ).current;

  const thumbLeft = clampedFraction * trackWidth;

  return (
    <View className="justify-center py-3" onLayout={handleLayout} {...panResponder.panHandlers}>
      <View style={{ height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, backgroundColor: theme.border }}>
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: thumbLeft + THUMB_SIZE / 2,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: theme.primary,
          }}
        />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: thumbLeft,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_SIZE / 2,
          backgroundColor: theme.primary,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
          elevation: 3,
        }}
      />
    </View>
  );
}
