import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBudgetLimits } from "@/hooks/useBudgetLimits";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { calculateBudgetStatus } from "@repo/shared/logic";
import { formatMonth } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { ReportRow } from "@/components/reports/ReportRow";
import { ReportExportBar } from "@/components/reports/ReportExportBar";
import { budgetStatusTone } from "@/lib/badgeTones";
import { useThemeColor } from "@/lib/colors";

export default function BudgetVsActualReportScreen() {
  const currentMonth = formatMonth(new Date());
  const { data: budgetLimits, isLoading: budgetsLoading, error: budgetsError } = useBudgetLimits();
  const { categoryBreakdown, isLoading: overviewLoading, error: overviewError } = useMonthlyOverview(currentMonth);
  const primary = useThemeColor("primary");

  const rows = useMemo(() => {
    if (!budgetLimits) return [];
    return budgetLimits.map((limit) => {
      const actual = categoryBreakdown.find((c) => c.name === limit.category?.name)?.value ?? 0;
      return {
        category: limit.category?.name ?? "Unknown",
        limit: limit.monthly_limit,
        actual,
        status: calculateBudgetStatus(actual, limit.monthly_limit),
      };
    });
  }, [budgetLimits, categoryBreakdown]);

  const isLoading = budgetsLoading || overviewLoading;
  const error = budgetsError || overviewError;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-3 p-4 pb-32">
        <PageHeader title="Budget vs Actual" description={`Spend against your monthly limit for ${currentMonth}.`} />
        <ReportExportBar
          title="Budget vs Actual"
          description={`Spend against your monthly limit for ${currentMonth}.`}
          sheets={[
            {
              name: "Budget vs Actual",
              rows: rows.map((r) => ({ Category: r.category, "Budget Limit": r.limit, Actual: r.actual, Status: r.status })),
            },
          ]}
        />
        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : rows.length === 0 ? (
          <AppText className="py-8 text-center text-sm text-muted-foreground">
            No budget limits set yet. Add some in Config → Budgets to see this report.
          </AppText>
        ) : (
          rows.map((r) => (
            <ReportRow
              key={r.category}
              title={r.category}
              badge={<StatusBadge tone={budgetStatusTone(r.status)}>{r.status}</StatusBadge>}
              values={[
                { label: "Budget", value: r.limit },
                { label: "Actual", value: r.actual, sign: r.actual > r.limit ? "negative" : "neutral" },
              ]}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
