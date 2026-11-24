import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Target, AlertTriangle, CheckCircle2 } from "lucide-react-native";
import { useBudgetLimits } from "@/hooks/useBudgetLimits";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { calculateBudgetStatus } from "@repo/shared/logic";
import { formatMonth, formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { StatusBadge } from "@/components/common/Badge";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Budget vs Actual Report Screen
 */
export default function BudgetVsActualReportScreen() {
  const { theme } = useTheme();
  const currentMonth = formatMonth(new Date());
  const { data: budgetLimits, isLoading: budgetsLoading, error: budgetsError } = useBudgetLimits();
  const { categoryBreakdown, isLoading: overviewLoading, error: overviewError } = useMonthlyOverview(currentMonth);

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

  const sheets = useMemo(
    () => [
      {
        name: "Budget vs Actual",
        headers: ["Category", "Monthly Limit", "Actual Spend", "Status"],
        rows: rows.map((r) => ({
          Category: r.category,
          "Monthly Limit": r.limit,
          "Actual Spend": r.actual,
          Status: r.status,
        })),
      },
    ],
    [rows]
  );

  const isLoading = budgetsLoading || overviewLoading;
  const error = budgetsError || overviewError;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Budget vs Actual"
          description={`Spend against your monthly limits for ${currentMonth}`}
        />

        <ReportExportBar
          title={`Budget vs Actual - ${currentMonth}`}
          description={`Tracking category budgets against actual spend in ${currentMonth}`}
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        <View className="gap-3">
          {rows.map((r) => {
            const isOver = r.actual > r.limit;
            const pct = r.limit > 0 ? (r.actual / r.limit) * 100 : 0;
            return (
              <Card key={r.category} variant="outlined" className="p-4 gap-2.5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Target size={18} color={isOver ? theme.destructive : theme.primary} />
                    <AppText className="text-sm font-semibold text-foreground">{r.category}</AppText>
                  </View>
                  <StatusBadge tone={isOver ? "destructive" : pct > 80 ? "warning" : "success"}>
                    {r.status.toUpperCase()}
                  </StatusBadge>
                </View>

                <View className="flex-row items-center justify-between text-xs">
                  <AppText className="text-xs text-muted-foreground">
                    Budget: {formatINR(r.limit)}
                  </AppText>
                  <View className="flex-row items-center gap-1">
                    <AppText className="text-xs text-muted-foreground">Spent:</AppText>
                    <AmountText
                      value={r.actual}
                      sign={isOver ? "negative" : "neutral"}
                      className="text-xs font-semibold"
                    />
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(3, pct))}%`,
                      backgroundColor: isOver ? theme.destructive : pct > 80 ? theme.warning : theme.success,
                    }}
                  />
                </View>
              </Card>
            );
          })}

          {!isLoading && rows.length === 0 && (
            <Card variant="outlined" className="p-6 items-center justify-center">
              <AppText className="text-sm text-muted-foreground">No monthly budget limits configured.</AppText>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
