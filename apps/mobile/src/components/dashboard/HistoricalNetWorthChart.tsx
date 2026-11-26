import { useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useNetWorthSnapshots } from "@/hooks/useNetWorthSnapshots";
import { filterSnapshotsByRange, calculateSnapshotGrowthPct, type NetWorthHistoryRange } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { ProBlurredPreview } from "@/components/shared/ProGate";
import { AreaLineChart } from "@/components/charts/AreaLineChart";
import { useTheme } from "@/theme/ThemeProvider";

const RANGE_OPTIONS = [
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
  { value: "All", label: "All" },
];

const PLACEHOLDER_DATA = Array.from({ length: 12 }, (_, i) => ({
  label: `M${i + 1}`,
  value: 1_000_000 + i * 22_000 + Math.sin(i / 3) * 35_000,
}));

function LiveHistoricalChart() {
  const { theme } = useTheme();
  const [range, setRange] = useState<NetWorthHistoryRange>("1Y");
  const { data: snapshots } = useNetWorthSnapshots();

  const filtered = useMemo(() => filterSnapshotsByRange(snapshots ?? [], range), [snapshots, range]);
  const currentNetWorth = filtered.length > 0 ? filtered[filtered.length - 1]!.net_worth : null;
  const firstNetWorth = filtered.length > 0 ? filtered[0]!.net_worth : null;
  const pctChange = currentNetWorth !== null ? calculateSnapshotGrowthPct(currentNetWorth, firstNetWorth) : null;

  return (
    <View className="gap-4 rounded-2xl bg-card p-4">
      <View className="flex-row items-center justify-between">
        <AppText className="text-sm font-semibold">Net Worth History</AppText>
      </View>
      <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={(v) => setRange(v as NetWorthHistoryRange)} />

      {(snapshots ?? []).length === 0 ? (
        <AppText className="py-4 text-sm text-muted-foreground">
          Take a net worth snapshot to start building your history.
        </AppText>
      ) : filtered.length === 0 ? (
        <AppText className="py-4 text-sm text-muted-foreground">No snapshots in this range yet.</AppText>
      ) : (
        <>
          <View className="flex-row items-baseline gap-3">
            <AppText className="text-2xl font-semibold" style={{ fontVariant: ["tabular-nums"] }}>
              {formatINR(currentNetWorth ?? 0)}
            </AppText>
            {pctChange !== null && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 2,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 12,
                  backgroundColor: pctChange >= 0 ? theme.primary + "18" : theme.destructive + "18",
                }}
              >
                {pctChange >= 0 ? (
                  <TrendingUp size={12} color={theme.primary} />
                ) : (
                  <TrendingDown size={12} color={theme.destructive} />
                )}
                <AppText
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: pctChange >= 0 ? theme.primary : theme.destructive,
                  }}
                >
                  {Math.abs(pctChange)}%
                </AppText>
              </View>
            )}
          </View>
          <AreaLineChart
            data={filtered.map((s) => ({ label: s.snapshot_date, value: s.net_worth }))}
            height={160}
          />
        </>
      )}
    </View>
  );
}

function HistoricalChartPlaceholder() {
  return (
    <View className="gap-4 rounded-2xl bg-card p-4">
      <AppText className="text-sm font-semibold">Net Worth History</AppText>
      <SegmentedControl options={RANGE_OPTIONS} value="1Y" onChange={() => {}} />
      <View className="flex-row items-baseline gap-3">
        <AppText className="text-2xl font-semibold" style={{ fontVariant: ["tabular-nums"] }}>
          {formatINR(1_400_000)}
        </AppText>
        <View className="rounded-full bg-success-subtle px-2 py-0.5">
          <AppText className="text-xs font-semibold text-success">12.5%</AppText>
        </View>
      </View>
      <AreaLineChart data={PLACEHOLDER_DATA} height={160} />
    </View>
  );
}

export function HistoricalNetWorthChart() {
  const { hasFeature } = useEntitlements();

  function goToUpgrade() {
    router.push("/billing");
  }

  return (
    <ProBlurredPreview
      feature="historicalCharts"
      title="Net Worth History"
      description="See your net worth trend over any time range, from 1 month to all-time."
      onUpgradePress={goToUpgrade}
    >
      {hasFeature("historicalCharts") ? <LiveHistoricalChart /> : <HistoricalChartPlaceholder />}
    </ProBlurredPreview>
  );
}
