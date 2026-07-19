import { View } from "react-native";
import { formatINR } from "@repo/shared/utils";
import { AppText } from "@/components/common/AppText";
import { useChartPalette } from "@/lib/colors";

interface CategoryBarListProps {
  data: Array<{ name: string; value: number }>;
}

/**
 * Mobile equivalent of ExpenseBreakdownChart.tsx. A hover-tooltip donut is a web-native
 * pattern — on a phone it's swiped past, not hovered, so this trades the donut for a
 * scannable proportional bar list, which reads faster at a glance on a narrow screen.
 * Same categorical palette in the same fixed order, same top-4-plus-Other rule.
 */
export function CategoryBarList({ data }: CategoryBarListProps) {
  const palette = useChartPalette();
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 4);
  const otherTotal = sorted.slice(4).reduce((sum, d) => sum + d.value, 0);
  const slices = otherTotal > 0 ? [...top, { name: "Other", value: otherTotal }] : top;

  if (slices.length === 0) {
    return (
      <View className="h-32 items-center justify-center">
        <AppText className="text-sm text-muted-foreground">No expenses this month yet.</AppText>
      </View>
    );
  }

  const max = Math.max(...slices.map((s) => s.value));

  return (
    <View className="gap-3">
      {slices.map((entry, i) => (
        <View key={entry.name} className="gap-1">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-shrink flex-row items-center gap-2">
              <View className="size-2.5 rounded-full" style={{ backgroundColor: palette[i % palette.length] }} />
              <AppText className="text-sm" numberOfLines={1}>
                {entry.name}
              </AppText>
            </View>
            <AppText
              className="text-sm font-medium text-foreground"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {formatINR(entry.value)}
            </AppText>
          </View>
          <View className="h-1.5 overflow-hidden rounded-full bg-muted">
            <View
              className="h-full rounded-full"
              style={{ width: `${(entry.value / max) * 100}%`, backgroundColor: palette[i % palette.length] }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
