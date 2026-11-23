import { useMemo } from "react";
import { ScrollView, View, Text, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { useMonthlyTrend } from "@/hooks/useMonthlyTrend";
import { useNetWorth } from "@/hooks/useNetWorth";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { useGoals } from "@/hooks/useGoals";
import { useCashbook } from "@/hooks/useCashbook";
import { formatMonth } from "@repo/shared/utils";
import { groupInvestmentsBySymbol } from "@repo/shared/logic";

/**
 * Headless Dashboard Container
 * Pure functional data container exposing Net Worth, Cash Flow KPIs, Holdings,
 * Goals, and Cashbook state without custom design themes or decorative widgets.
 */
export default function DashboardScreen() {
  const currentMonth = formatMonth(new Date());
  const {
    income: monthlyIncome,
    expense: monthlyExpense,
    netSavings,
    savingsRate,
    categoryBreakdown,
    isLoading: overviewLoading,
    error: overviewError,
  } = useMonthlyOverview(currentMonth);

  const { data: trend, isLoading: trendLoading } = useMonthlyTrend(6);
  const { data: netWorth, isLoading: netWorthLoading, error: netWorthError } = useNetWorth();
  const { data: allInvestments } = useAllInvestmentLog();
  const { data: holdingRows } = useHoldings();
  const { data: goals } = useGoals();
  const { summary: cashbookSummary } = useCashbook();

  const livePriceOverrides = useMemo(
    () => Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price])),
    [holdingRows]
  );
  const holdings = useMemo(
    () => (allInvestments ? groupInvestmentsBySymbol(allInvestments, livePriceOverrides) : []),
    [allInvestments, livePriceOverrides]
  );

  const totalGoals = goals?.length ?? 0;
  const achievedGoals = goals?.filter((g) => g.saved_amount >= g.target_amount).length ?? 0;
  const totalCounterparties = cashbookSummary ? Object.keys(cashbookSummary).length : 0;

  const totalAssets = (netWorth?.netWorth ?? 0) + (netWorth?.liabilitiesTotal ?? 0);
  const totalLiabilities = netWorth?.liabilitiesTotal ?? 0;

  const isLoading = overviewLoading || trendLoading || netWorthLoading;
  const error = overviewError || netWorthError;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        {/* Header */}
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Dashboard</Text>
          <Text style={{ fontSize: 14, color: "#6b7280" }}>Month: {currentMonth}</Text>
        </View>

        {isLoading && <ActivityIndicator size="small" />}

        {error && (
          <View style={{ padding: 12, backgroundColor: "#fee2e2", borderRadius: 8 }}>
            <Text style={{ color: "#b91c1c" }}>{error.message || "Failed to load dashboard data"}</Text>
          </View>
        )}

        {/* Net Worth Headless Section */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", textTransform: "uppercase", color: "#6b7280" }}>
            Net Worth
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "bold" }}>
            ₹{(netWorth?.netWorth ?? 0).toLocaleString("en-IN")}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8 }}>
            <View>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Total Assets</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#16a34a" }}>
                ₹{totalAssets.toLocaleString("en-IN")}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Total Liabilities</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#dc2626" }}>
                ₹{totalLiabilities.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </View>

        {/* Monthly Cash Flow Headless Section */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", textTransform: "uppercase", color: "#6b7280" }}>
            Monthly Cash Flow
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
            <View style={{ minWidth: 120 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Income</Text>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#16a34a" }}>
                ₹{monthlyIncome.toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={{ minWidth: 120 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Expenses</Text>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#dc2626" }}>
                ₹{monthlyExpense.toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={{ minWidth: 120 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Net Savings</Text>
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                ₹{netSavings.toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={{ minWidth: 120 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Savings Rate</Text>
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>{savingsRate.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown Data List */}
        {categoryBreakdown && categoryBreakdown.length > 0 && (
          <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", textTransform: "uppercase", color: "#6b7280" }}>
              Category Breakdown
            </Text>
            {categoryBreakdown.map((cat, idx) => (
              <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                <Text style={{ fontSize: 14 }}>{cat.name}</Text>
                <Text style={{ fontSize: 14, fontWeight: "600" }}>₹{cat.value.toLocaleString("en-IN")}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary Badges: Holdings, Goals, Cashbook */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", textTransform: "uppercase", color: "#6b7280" }}>
            Module Summaries
          </Text>
          <Text style={{ fontSize: 14 }}>Holdings tracked: {holdings.length} symbols</Text>
          <Text style={{ fontSize: 14 }}>Goals: {achievedGoals} / {totalGoals} completed</Text>
          <Text style={{ fontSize: 14 }}>Cashbook counterparties: {totalCounterparties}</Text>
        </View>

        {/* Quick Navigation Triggers */}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Pressable
            onPress={() => router.push("/transactions")}
            style={{ padding: 12, backgroundColor: "#2563eb", borderRadius: 8 }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>+ Add / View Transactions</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/portfolio")}
            style={{ padding: 12, borderWidth: 1, borderColor: "#2563eb", borderRadius: 8 }}
          >
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>View Portfolio</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
