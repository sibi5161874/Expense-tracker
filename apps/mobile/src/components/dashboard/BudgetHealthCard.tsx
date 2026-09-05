import { useMemo } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useBudgetLimits } from "@/hooks/useBudgetLimits";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { calculateBudgetStatus, type BudgetStatus } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { formatMonth } from "@repo/shared/utils";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { budgetStatusTone } from "@/lib/badgeTones";
import { useThemeColor } from "@/lib/colors";

const INDICATOR_COLOR_TOKEN: Record<BudgetStatus, "success" | "warning" | "destructive"> = {
  ok: "success",
  warning: "warning",
  over: "destructive",
};

/** Mirrors apps/web/src/components/dashboard/BudgetHealthCard.tsx. */
export function BudgetHealthCard() {
  const currentMonth = formatMonth(new Date());
  const { data: budgetLimits } = useBudgetLimits();
  const { categoryBreakdown } = useMonthlyOverview(currentMonth);
  const success = useThemeColor("success");
  const warning = useThemeColor("warning");
  const destructive = useThemeColor("destructive");
  const colorByTone = { success, warning, destructive };

  const rows = useMemo(() => {
    if (!budgetLimits) return [];
    return budgetLimits
      .map((limit) => {
        const actual = categoryBreakdown.find((c) => c.name === limit.category?.name)?.value ?? 0;
        return {
          category: limit.category?.name ?? "Unknown",
          limit: limit.monthly_limit,
          actual,
          status: calculateBudgetStatus(actual, limit.monthly_limit),
          pct: limit.monthly_limit > 0 ? Math.min((actual / limit.monthly_limit) * 100, 100) : 0,
        };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);
  }, [budgetLimits, categoryBreakdown]);

  return (
    <View className="gap-4 rounded-2xl bg-card p-4">
      <AppText className="text-sm font-semibold">Budget health</AppText>
      {rows.length === 0 ? (
        <AppText className="text-sm text-muted-foreground">
          No budget limits set yet.{" "}
          <AppText className="text-sm text-primary" onPress={() => router.push("/(app)/config")}>
            Add some in Config
          </AppText>{" "}
          to track spend against a monthly cap.
        </AppText>
      ) : (
        <View className="gap-4">
          {rows.map((row) => (
            <View key={row.category} className="gap-1.5">
              <View className="flex-row items-center justify-between gap-2">
                <AppText className="flex-1 text-sm font-medium" numberOfLines={1}>
                  {row.category}
                </AppText>
                <View className="flex-row items-center gap-2">
                  <AppText className="text-xs text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                    {formatINR(row.actual)} / {formatINR(row.limit)}
                  </AppText>
                  <StatusBadge tone={budgetStatusTone(row.status)}>{row.status}</StatusBadge>
                </View>
              </View>
              <ProgressBar value={row.pct} color={colorByTone[INDICATOR_COLOR_TOKEN[row.status]]} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
