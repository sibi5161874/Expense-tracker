import { View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { formatINR } from "@repo/shared/utils/currency";
import { useThemeColor } from "@/lib/colors";

interface NetWorthSparklinePoint {
  date: string;
  value: number;
}

/** Hand-built bar sparkline from plain Views, matching CashFlowBars.tsx's convention —
 * Recharts doesn't run on React Native, and this codebase's established pattern for chart
 * data on mobile is a simple bar layout rather than a smooth line/area (which would need
 * react-native-svg path drawing this app hasn't used anywhere else). */
export function NetWorthSparkline({ data }: { data: NetWorthSparklinePoint[] }) {
  const success = useThemeColor("success");
  const mutedForeground = useThemeColor("mutedForeground");

  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(0, ...values);
  const range = max - min || 1;

  return (
    <View className="gap-1">
      <View className="h-32 flex-row items-end gap-1">
        {data.map((d, i) => (
          <View key={`${d.date}-${i}`} className="flex-1 items-center justify-end">
            <View
              style={{ height: `${Math.max(((d.value - min) / range) * 100, 4)}%`, backgroundColor: success }}
              className="w-full rounded-t"
            />
          </View>
        ))}
      </View>
      <View className="flex-row justify-between">
        <AppText className="text-xs text-muted-foreground">{data[0]!.date}</AppText>
        <AppText className="text-xs text-muted-foreground">{data[data.length - 1]!.date}</AppText>
      </View>
      <AppText className="text-xs" style={{ color: mutedForeground }}>
        Range: {formatINR(min)} – {formatINR(max)}
      </AppText>
    </View>
  );
}
