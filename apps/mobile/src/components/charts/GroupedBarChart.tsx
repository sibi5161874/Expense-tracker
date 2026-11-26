import { useState } from "react";
import { View, LayoutChangeEvent, Pressable } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useTheme } from "@/theme/ThemeProvider";
import { AppText } from "@/components/common/AppText";
import { formatINR } from "@repo/shared/utils";

export interface BarGroup {
  label: string;
  bars: {
    name: string;
    value: number;
    color: string;
  }[];
}

interface GroupedBarChartProps {
  data: BarGroup[];
  height?: number;
}

export function GroupedBarChart({ data, height = 150 }: GroupedBarChartProps) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(300);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <AppText style={{ fontSize: 13, color: theme.mutedForeground }}>No data to plot</AppText>
      </View>
    );
  }

  // Find max value across all bars for normalization
  let maxVal = 0;
  data.forEach((group) => {
    group.bars.forEach((b) => {
      if (b.value > maxVal) maxVal = b.value;
    });
  });
  if (maxVal === 0) maxVal = 1;

  const paddingBottom = 22;
  const paddingTop = 10;
  const availableHeight = height - paddingBottom - paddingTop;

  const numGroups = data.length;
  const groupWidth = width / numGroups;
  const barGap = 4;

  const activeGroup = selectedIndex !== null ? data[selectedIndex] : null;

  return (
    <View
      style={{ width: "100%", gap: 6 }}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {/* Active Group Details */}
      {activeGroup && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }}>
          <AppText style={{ fontSize: 12, fontWeight: "700", color: theme.foreground }}>
            {activeGroup.label}:
          </AppText>
          {activeGroup.bars.map((b) => (
            <View key={b.name} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: b.color }} />
              <AppText style={{ fontSize: 11, color: theme.mutedForeground }}>
                {b.name}: {formatINR(b.value)}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {/* SVG Canvas */}
      <View style={{ width: "100%", height }}>
        <Svg width={width} height={height}>
          {data.map((group, groupIdx) => {
            const numBars = group.bars.length;
            const groupX = groupIdx * groupWidth;
            const totalBarsWidth = groupWidth * 0.75;
            const singleBarWidth = Math.max((totalBarsWidth - (numBars - 1) * barGap) / numBars, 6);
            const groupOffset = (groupWidth - totalBarsWidth) / 2;

            return group.bars.map((bar, barIdx) => {
              const barHeight = Math.max((bar.value / maxVal) * availableHeight, 4);
              const x = groupX + groupOffset + barIdx * (singleBarWidth + barGap);
              const y = paddingTop + (availableHeight - barHeight);
              const isSelected = selectedIndex === groupIdx;

              return (
                <Rect
                  key={`${groupIdx}-${barIdx}`}
                  x={x}
                  y={y}
                  width={singleBarWidth}
                  height={barHeight}
                  rx="3"
                  ry="3"
                  fill={bar.color}
                  opacity={selectedIndex !== null && !isSelected ? 0.4 : 1}
                  onPress={() => setSelectedIndex(selectedIndex === groupIdx ? null : groupIdx)}
                />
              );
            });
          })}
        </Svg>
      </View>

      {/* X-Axis Labels */}
      <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
        {data.map((group, idx) => (
          <Pressable
            key={group.label}
            onPress={() => setSelectedIndex(selectedIndex === idx ? null : idx)}
            style={{ flex: 1, alignItems: "center" }}
          >
            <AppText
              style={{
                fontSize: 10,
                color: selectedIndex === idx ? theme.primary : theme.mutedForeground,
                fontWeight: selectedIndex === idx ? "700" : "500",
              }}
              numberOfLines={1}
            >
              {group.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
