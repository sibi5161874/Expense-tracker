import { useState } from "react";
import { View, Pressable } from "react-native";
import Svg, { G, Circle, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/theme/ThemeProvider";
import { AppText } from "@/components/common/AppText";
import { formatINR } from "@repo/shared/utils";

export interface DonutSlice {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerTitle?: string;
  centerSubtitle?: string;
}

const DEFAULT_PALETTE = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
  "#6366F1",
];

export function DonutChart({
  data,
  size = 180,
  strokeWidth = 22,
  centerTitle,
  centerSubtitle,
}: DonutChartProps) {
  const { theme } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const validData = data.filter((d) => d.value > 0);
  const total = validData.reduce((acc, d) => acc + d.value, 0);

  if (total <= 0 || validData.length === 0) {
    return (
      <View style={{ alignItems: "center", justifyContent: "center", height: size }}>
        <AppText style={{ fontSize: 13, color: theme.mutedForeground }}>No data to display</AppText>
      </View>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentAngle = -90; // Start at top

  const activeSlice = selectedIndex !== null ? validData[selectedIndex] : null;

  return (
    <View style={{ alignItems: "center", gap: 16 }}>
      {/* Donut SVG */}
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size}>
          {/* Background Track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.surfaceContainer || "#e5e7eb"}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Slices */}
          <G rotation="-90" origin={`${center}, ${center}`}>
            {validData.map((slice, index) => {
              const fraction = slice.value / total;
              const strokeDasharray = `${circumference * fraction} ${circumference * (1 - fraction)}`;
              const strokeDashoffset = -circumference * (currentAngle / 360 + 0.25);
              currentAngle += fraction * 360;

              const isSelected = selectedIndex === index;
              const sliceColor = slice.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];

              return (
                <Circle
                  key={slice.name}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={sliceColor}
                  strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  opacity={selectedIndex !== null && !isSelected ? 0.45 : 1}
                  onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
                />
              );
            })}
          </G>
        </Svg>

        {/* Center Text Display */}
        <View style={{ position: "absolute", alignItems: "center", justifyContent: "center", width: size * 0.65 }}>
          <AppText
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: theme.foreground,
              textAlign: "center",
            }}
            numberOfLines={1}
          >
            {activeSlice ? formatINR(activeSlice.value) : centerTitle || formatINR(total)}
          </AppText>
          <AppText
            style={{
              fontSize: 11,
              color: theme.mutedForeground,
              textAlign: "center",
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {activeSlice
              ? `${activeSlice.name} (${Math.round((activeSlice.value / total) * 100)}%)`
              : centerSubtitle || "Total"}
          </AppText>
        </View>
      </View>

      {/* Legend Grid */}
      <View style={{ width: "100%", gap: 8 }}>
        {validData.slice(0, 6).map((slice, index) => {
          const isSelected = selectedIndex === index;
          const sliceColor = slice.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
          const pct = Math.round((slice.value / total) * 100);

          return (
            <Pressable
              key={slice.name}
              onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: isSelected
                    ? (theme.surfaceContainerHighest || "#88888820")
                    : pressed
                    ? "#88888810"
                    : "transparent",
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: sliceColor }} />
                <AppText style={{ fontSize: 13, color: theme.foreground }} numberOfLines={1}>
                  {slice.name}
                </AppText>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <AppText style={{ fontSize: 12, color: theme.mutedForeground }}>{pct}%</AppText>
                <AppText style={{ fontSize: 13, fontWeight: "600", color: theme.foreground }}>
                  {formatINR(slice.value)}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
