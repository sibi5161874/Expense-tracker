import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { useBudgetLimits } from "@/hooks/useBudgetLimits";
import { useNetWorth } from "@/hooks/useNetWorth";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { useGoals } from "@/hooks/useGoals";
import { formatMonth } from "@repo/shared/utils";
import { groupInvestmentsBySymbol, summarizeHoldings } from "@repo/shared/logic";

/**
 * Headless Overall Report Container
 */
export default function OverallReportScreen() {
  const currentMonth = formatMonth(new Date());
  const { data: budgetLimits, isLoading: budgetsLoading } = useBudgetLimits();
  const { income, expense, netSavings, isLoading: overviewLoading } = useMonthlyOverview(currentMonth);
  const { data: allInvestments, isLoading: investmentsLoading } = useAllInvestmentLog();
  const { data: holdingRows, isLoading: holdingsLoading } = useHoldings();
  const { data: netWorth, isLoading: netWorthLoading } = useNetWorth();
  const { data: goals, isLoading: goalsLoading } = useGoals();

  const livePriceOverrides = useMemo(
    () => Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price])),
    [holdingRows]
  );
  const holdings = useMemo(
    () => (allInvestments ? groupInvestmentsBySymbol(allInvestments, livePriceOverrides) : []),
    [allInvestments, livePriceOverrides]
  );
  const portfolioSummary = allInvestments ? summarizeHoldings(holdings) : null;

  const isLoading = budgetsLoading || overviewLoading || investmentsLoading || holdingsLoading || netWorthLoading || goalsLoading;

  const reportsList = [
    { title: "Monthly Summary", stat: `Net: ₹${netSavings.toLocaleString("en-IN")}`, href: "/monthly-summary-report" },
    { title: "Net Worth Statement", stat: `₹${(netWorth?.netWorth ?? 0).toLocaleString("en-IN")}`, href: "/net-worth-report" },
    { title: "Portfolio Holdings", stat: `₹${(portfolioSummary?.currentValue ?? 0).toLocaleString("en-IN")}`, href: "/portfolio" },
    { title: "XIRR Analysis", stat: "Annualized return", href: "/xirr-report" },
    { title: "Capital Gains (Tax)", stat: "STCG / LTCG", href: "/capital-gains-report" },
    { title: "Budget vs Actual", stat: `${budgetLimits?.length ?? 0} categories`, href: "/budget-vs-actual-report" },
    { title: "Spending Trend", stat: "Last 6 months", href: "/spending-trend-report" },
    { title: "Account Flow", stat: "Cash movement", href: "/account-flow-report" },
    { title: "Asset Allocation", stat: "Breakdown by type", href: "/asset-allocation-report" },
    { title: "Maturity Calendar", stat: "FDs & Insurance", href: "/asset-maturity-calendar-report" },
    { title: "Goal Progress", stat: `${goals?.length ?? 0} goals`, href: "/goal-progress-report" },
    { title: "Cashbook Net Position", stat: "Counterparties", href: "/cashbook-net-position-report" },
    { title: "Dividend Income", stat: "Yields & Payouts", href: "/dividend-income-report" },
    { title: "Year in Review", stat: "Full year performance", href: "/year-in-review-report" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Overall Reports Suite</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Direct access to all analytical statements and reports</Text>
        </View>

        {isLoading && <ActivityIndicator />}

        <View style={{ gap: 8 }}>
          {reportsList.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => router.push(item.href as any)}
              style={{
                padding: 14,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "600" }}>{item.title}</Text>
              <Text style={{ color: "#2563eb", fontWeight: "500" }}>{item.stat} &rarr;</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
