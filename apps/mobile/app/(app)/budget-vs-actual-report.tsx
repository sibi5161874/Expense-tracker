import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBudgetLimits } from "@/hooks/useBudgetLimits";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { calculateBudgetStatus } from "@repo/shared/logic";
import { formatMonth } from "@repo/shared/utils";

/**
 * Headless Budget vs Actual Report Container
 */
export default function BudgetVsActualReportScreen() {
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

  const isLoading = budgetsLoading || overviewLoading;
  const error = budgetsError || overviewError;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Budget vs Actual</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Spend against your monthly limit for {currentMonth}</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        <View style={{ gap: 8 }}>
          {rows.map((r) => (
            <View
              key={r.category}
              style={{
                padding: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 6,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ gap: 2 }}>
                <Text style={{ fontWeight: "600" }}>{r.category}</Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                  Budget: ₹{r.limit.toLocaleString("en-IN")} &bull; Status: {r.status}
                </Text>
              </View>
              <Text
                style={{
                  fontWeight: "bold",
                  color: r.actual > r.limit ? "#dc2626" : "#16a34a",
                }}
              >
                ₹{r.actual.toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
          {!isLoading && rows.length === 0 && (
            <Text style={{ color: "#6b7280" }}>No budget limits configured.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
