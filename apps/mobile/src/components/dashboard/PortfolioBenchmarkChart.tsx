import { useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useNetWorthSnapshots } from "@/hooks/useNetWorthSnapshots";
import { useBenchmarkHistory, type BenchmarkRange } from "@/hooks/useBenchmarkHistory";
import { buildBenchmarkSeries, type BenchmarkPoint } from "@repo/shared/logic";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { ProBlurredPreview } from "@/components/shared/ProGate";
import { useThemeColor } from "@/lib/colors";

// Static, no network — a visual stand-in shown blurred to free-tier users.
const PLACEHOLDER_SERIES: BenchmarkPoint[] = Array.from({ length: 20 }, (_, i) => ({
  date: String(i),
  netWorth: 1_000_000 + i * 18_000 + Math.sin(i / 2) * 40_000,
  benchmark: 1_000_000 + i * 12_000 + Math.cos(i / 3) * 30_000,
}));

const NIFTY_TICKER = "^NSEI";
const MAX_BARS = 20;

const RANGE_OPTIONS = [
  { value: "1mo", label: "1M" },
  { value: "3mo", label: "3M" },
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1Y" },
];

/** Downsamples to at most MAX_BARS evenly-spaced points — a year of daily closes doesn't fit
 * as individual bars on a phone width, and the trend reads the same either way. */
function downsample(series: BenchmarkPoint[]): BenchmarkPoint[] {
  if (series.length <= MAX_BARS) return series;
  const step = series.length / MAX_BARS;
  return Array.from({ length: MAX_BARS }, (_, i) => series[Math.floor(i * step)]!);
}

function BenchmarkBars({ series }: { series: BenchmarkPoint[] }) {
  const success = useThemeColor("success");
  const chart2 = useThemeColor("chart2");
  const sampled = downsample(series);
  const max = Math.max(...sampled.flatMap((s) => [s.netWorth, s.benchmark]), 1);

  return (
    <View className="gap-2">
      <View className="h-40 flex-row items-end gap-1.5">
        {sampled.map((s, i) => (
          <View key={`${s.date}-${i}`} className="flex-1 flex-row items-end justify-center gap-0.5">
            <View style={{ height: `${(s.netWorth / max) * 100}%`, backgroundColor: success }} className="w-1.5 rounded-t" />
            <View style={{ height: `${(s.benchmark / max) * 100}%`, backgroundColor: chart2 }} className="w-1.5 rounded-t" />
          </View>
        ))}
      </View>
      <View className="flex-row gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="size-2 rounded-full" style={{ backgroundColor: success }} />
          <AppText className="text-xs text-muted-foreground">Your Net Worth</AppText>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="size-2 rounded-full" style={{ backgroundColor: chart2 }} />
          <AppText className="text-xs text-muted-foreground">Nifty 50 (scaled)</AppText>
        </View>
      </View>
    </View>
  );
}

function LiveBenchmarkChart() {
  const [range, setRange] = useState<BenchmarkRange>("1y");
  const { data: snapshots, isLoading: snapshotsLoading, error: snapshotsError } = useNetWorthSnapshots();
  const { data: history, isLoading: historyLoading, error: historyError } = useBenchmarkHistory(NIFTY_TICKER, range);

  const series = useMemo(() => {
    if (!snapshots || !history) return [];
    return buildBenchmarkSeries(snapshots, history);
  }, [snapshots, history]);

  return (
    <View className="gap-4 rounded-2xl bg-card p-4">
      <AppText className="text-sm font-semibold">Portfolio vs Nifty 50</AppText>
      <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={(v) => setRange(v as BenchmarkRange)} />

      {snapshotsLoading || historyLoading ? (
        <AppText className="py-4 text-sm text-muted-foreground">Loading benchmark…</AppText>
      ) : snapshotsError || historyError ? (
        <AppText className="text-sm text-destructive">{(snapshotsError ?? historyError)?.message}</AppText>
      ) : (snapshots ?? []).length === 0 ? (
        <View className="items-center gap-3 py-4">
          <AppText className="text-center text-sm text-muted-foreground">
            Take a net worth snapshot to start comparing your growth against Nifty 50.
          </AppText>
          <Button onPress={() => router.push("/(app)/net-worth-report")}>Take a Snapshot</Button>
        </View>
      ) : series.length === 0 ? (
        <AppText className="py-4 text-sm text-muted-foreground">No Nifty 50 history for this range yet.</AppText>
      ) : (
        <BenchmarkBars series={series} />
      )}
    </View>
  );
}

function BenchmarkPlaceholder() {
  return (
    <View className="gap-4 rounded-2xl bg-card p-4">
      <AppText className="text-sm font-semibold">Portfolio vs Nifty 50</AppText>
      <SegmentedControl options={RANGE_OPTIONS} value="1y" onChange={() => {}} />
      <BenchmarkBars series={PLACEHOLDER_SERIES} />
    </View>
  );
}

/** Mirrors apps/web/src/components/dashboard/PortfolioBenchmarkChart.tsx. */
export function PortfolioBenchmarkChart() {
  const { hasFeature } = useEntitlements();

  return (
    <ProBlurredPreview
      feature="livePriceRefresh"
      title="Portfolio vs Nifty 50"
      description="See how your net worth growth stacks up against the market, over any time range."
      onUpgradePress={() => router.push("/(app)/billing")}
    >
      {hasFeature("livePriceRefresh") ? <LiveBenchmarkChart /> : <BenchmarkPlaceholder />}
    </ProBlurredPreview>
  );
}
