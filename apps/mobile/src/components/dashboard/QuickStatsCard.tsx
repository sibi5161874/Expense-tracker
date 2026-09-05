import { View } from "react-native";
import { AppText } from "@/components/common/AppText";

interface QuickStat {
  label: string;
  value: string | number;
}

/** Mirrors apps/web/src/components/dashboard/QuickStatsCard.tsx. */
export function QuickStatsCard({ stats }: { stats: QuickStat[] }) {
  return (
    <View className="gap-3 rounded-2xl bg-card p-4">
      <AppText className="text-sm font-semibold">Quick stats</AppText>
      {stats.map((stat) => (
        <View key={stat.label} className="flex-row justify-between">
          <AppText className="text-sm text-muted-foreground">{stat.label}</AppText>
          <AppText className="text-sm font-medium" style={{ fontVariant: ["tabular-nums"] }}>
            {stat.value}
          </AppText>
        </View>
      ))}
    </View>
  );
}
