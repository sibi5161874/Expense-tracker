import { useMemo, useState } from "react";
import { View, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { Camera, Trash2, Lock } from "lucide-react-native";
import { useNetWorthSnapshots } from "@/hooks/useNetWorthSnapshots";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  buildSnapshotFromBreakdown,
  calculateSnapshotGrowthPct,
  canAddSnapshotThisMonth,
  type NetWorthBreakdown,
} from "@repo/shared/logic";
import { formatMonth } from "@repo/shared/utils";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";
import { NetWorthSparkline } from "@/components/dashboard/NetWorthSparkline";
import { useThemeColor } from "@/lib/colors";

/** Mirrors apps/web/src/components/reports/NetWorthSnapshotHistory.tsx — "Take Snapshot"
 * freezes today's live NetWorthBreakdown; history shows growth month-over-month. */
export function NetWorthSnapshotHistory({ currentBreakdown }: { currentBreakdown: NetWorthBreakdown }) {
  const { data: snapshots, takeSnapshot, deleteSnapshot, isTakingSnapshot, isDeleting } = useNetWorthSnapshots();
  const { tier } = useEntitlements();
  const [error, setError] = useState<string | null>(null);
  const success = useThemeColor("success");
  const destructive = useThemeColor("destructive");
  const mutedForeground = useThemeColor("mutedForeground");

  const rows = useMemo(() => {
    const sorted = snapshots ?? [];
    return sorted.map((snap, i) => ({
      ...snap,
      growthPct: calculateSnapshotGrowthPct(snap.net_worth, sorted[i - 1]?.net_worth ?? null),
    }));
  }, [snapshots]);

  const currentMonthPrefix = formatMonth(new Date());
  const snapshotsThisMonth = (snapshots ?? []).filter((s) => s.snapshot_date.startsWith(currentMonthPrefix)).length;
  const canTakeSnapshot = canAddSnapshotThisMonth(snapshotsThisMonth, tier);

  async function handleTakeSnapshot() {
    if (!canTakeSnapshot) {
      Alert.alert("Pro feature", "You've used this month's free snapshots.", [
        { text: "Not now", style: "cancel" },
        { text: "View plans", onPress: () => router.push("/(app)/billing") },
      ]);
      return;
    }
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await takeSnapshot(buildSnapshotFromBreakdown(currentBreakdown, today));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save snapshot");
    }
  }

  function handleDelete(id: string) {
    Alert.alert("Delete snapshot?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteSnapshot(id) },
    ]);
  }

  return (
    <View className="gap-3 rounded-2xl bg-card p-4">
      <View className="flex-row items-center justify-between">
        <AppText className="text-sm font-semibold">Net Worth Over Time</AppText>
        <Button variant="outline" onPress={handleTakeSnapshot} disabled={isTakingSnapshot}>
          {canTakeSnapshot ? <Camera size={16} color={mutedForeground} /> : <Lock size={16} color={mutedForeground} />}
          <AppText className="text-sm font-medium">{isTakingSnapshot ? "Saving…" : "Snapshot"}</AppText>
        </Button>
      </View>

      {error && <AppText className="text-sm text-destructive">{error}</AppText>}

      {rows.length === 0 ? (
        <AppText className="text-sm text-muted-foreground">
          No snapshots yet. Take one to start tracking net worth growth over time.
        </AppText>
      ) : (
        <>
          <NetWorthSparkline data={rows.map((r) => ({ date: r.snapshot_date, value: r.net_worth }))} />
          <View className="gap-2">
            {rows
              .slice()
              .reverse()
              .map((r) => (
                <View key={r.id} className="flex-row items-center justify-between rounded-xl bg-muted px-3 py-2.5">
                  <AppText className="text-sm">{r.snapshot_date}</AppText>
                  <View className="flex-row items-center gap-3">
                    <AppText className="text-sm font-medium" style={{ fontVariant: ["tabular-nums"] }}>
                      {formatINR(r.net_worth)}
                    </AppText>
                    {r.growthPct !== null && (
                      <AppText className="text-xs font-medium" style={{ color: r.growthPct >= 0 ? success : destructive }}>
                        {r.growthPct >= 0 ? "+" : ""}
                        {r.growthPct}%
                      </AppText>
                    )}
                    <Pressable onPress={() => handleDelete(r.id)} disabled={isDeleting} hitSlop={14}>
                      <Trash2 size={14} color={mutedForeground} />
                    </Pressable>
                  </View>
                </View>
              ))}
          </View>
        </>
      )}
    </View>
  );
}
