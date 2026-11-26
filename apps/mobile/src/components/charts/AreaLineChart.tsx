import { useState } from "react";
import { View, LayoutChangeEvent, PanResponder, GestureResponderEvent } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from "react-native-svg";
import { useTheme } from "@/theme/ThemeProvider";
import { AppText } from "@/components/common/AppText";
import { formatINR } from "@repo/shared/utils";

export interface AreaDataPoint {
  label: string;
  value: number;
}

interface AreaLineChartProps {
  data: AreaDataPoint[];
  height?: number;
  strokeColor?: string;
  fillColor?: string;
}

export function AreaLineChart({
  data,
  height = 160,
  strokeColor,
  fillColor,
}: AreaLineChartProps) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(300);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const primary = strokeColor || theme.primary;
  const areaFill = fillColor || primary;

  if (!data || data.length === 0) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <AppText style={{ fontSize: 13, color: theme.mutedForeground }}>No data to plot</AppText>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal || 1;

  const paddingLeft = 10;
  const paddingRight = 10;
  const paddingTop = 16;
  const paddingBottom = 20;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Build coordinate points
  const points = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * plotWidth;
    const y = paddingTop + plotHeight - ((d.value - minVal) / valRange) * plotHeight;
    return { x, y, label: d.label, value: d.value };
  });

  // Generate smooth cubic bezier SVG path
  let linePath = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const cx1 = p0.x + (p1.x - p0.x) / 2;
    const cy1 = p0.y;
    const cx2 = p0.x + (p1.x - p0.x) / 2;
    const cy2 = p1.y;
    linePath += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
  }

  const lastPoint = points[points.length - 1]!;
  const firstPoint = points[0]!;
  const areaPath = `${linePath} L ${lastPoint.x} ${height - paddingBottom} L ${firstPoint.x} ${height - paddingBottom} Z`;

  function onTouch(evt: GestureResponderEvent) {
    const touchX = evt.nativeEvent.locationX;
    let closestIndex = 0;
    let minDistance = Infinity;
    points.forEach((p, idx) => {
      const dist = Math.abs(p.x - touchX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });
    setActiveIndex(closestIndex);
  }

  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  return (
    <View
      style={{ width: "100%", gap: 6 }}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {/* Active Point Display */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", minHeight: 24, paddingHorizontal: 4 }}>
        <AppText style={{ fontSize: 13, fontWeight: "700", color: theme.foreground }}>
          {activePoint ? formatINR(activePoint.value) : formatINR(points[points.length - 1]!.value)}
        </AppText>
        <AppText style={{ fontSize: 11, color: theme.mutedForeground }}>
          {activePoint ? activePoint.label : points[points.length - 1]!.label}
        </AppText>
      </View>

      {/* SVG Canvas with Touch Tracking */}
      <View
        style={{ width: "100%", height }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={onTouch}
        onResponderMove={onTouch}
        onResponderRelease={() => setActiveIndex(null)}
      >
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={areaFill} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={areaFill} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Area Fill */}
          <Path d={areaPath} fill="url(#areaGradient)" />

          {/* Smooth Line Stroke */}
          <Path d={linePath} fill="none" stroke={primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Active Crosshair & Dot */}
          {activePoint && (
            <>
              <Line
                x1={activePoint.x}
                y1={paddingTop}
                x2={activePoint.x}
                y2={height - paddingBottom}
                stroke={theme.mutedForeground}
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="5"
                fill={primary}
                stroke={theme.background}
                strokeWidth="2"
              />
            </>
          )}
        </Svg>
      </View>

      {/* X-Axis Range Indicators */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
        <AppText style={{ fontSize: 10, color: theme.mutedForeground }}>{data[0]?.label}</AppText>
        <AppText style={{ fontSize: 10, color: theme.mutedForeground }}>{data[data.length - 1]?.label}</AppText>
      </View>
    </View>
  );
}
