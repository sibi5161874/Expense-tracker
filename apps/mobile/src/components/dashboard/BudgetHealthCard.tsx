import { useMemo } from "react";
import { View, Pressable } from "react-native";
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
import { useTheme } from "@/theme/ThemeProvider";

const INDICATOR_COLOR_TOKEN: Record<BudgetStatus, "success" | "warning" | "destructive"> = {
  ok: "success",
  warning: "warning",
  over: "destructive",
};

/** Awwwards-Craft Budget Health Card with hairline borders and tabular numerals. */
export function BudgetHealthCard() {
  const { theme } = useTheme();
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
    <View className="gap-4 rounded-2xl border border-border/70 bg-card p-4.5 shadow-sm">
      <View className="flex-row items-center justify-between">
        <AppText className="text-sm font-semibold tracking-tight text-foreground">
          Budget Health
        </AppText>
        <Pressable
          onPress={() => router.push("/config")}
          className="active:opacity-75"
        >
          <AppText className="text-xs font-medium text-primary">
            Manage
          </AppText>
        </Pressable>
      </View>

      {rows.length === 0 ? (
        <AppText className="text-sm text-muted-foreground">
          No budget limits set yet.{" "}
          <AppText
            className="text-sm font-semibold text-primary"
            onPress={() => router.push("/config")}
          >
            Add limits in Config
          </AppText>{" "}
          to track spending limits.
        </AppText>
      ) : (
        <View className="gap-4">
          {rows.map((row) => (
            <View key={row.category} className="gap-1.5">
              <View className="flex-row items-center justify-between gap-2">
                <AppText className="flex-1 text-sm font-medium text-foreground" numberOfLines={1}>
                  {row.category}
                </AppText>
                <View className="flex-row items-center gap-2">
                  <AppText
                    className="text-xs text-muted-foreground"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
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
