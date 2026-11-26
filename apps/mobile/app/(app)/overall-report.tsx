import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronRight, FileText, PieChart, TrendingUp } from "lucide-react-native";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { useBudgetLimits } from "@/hooks/useBudgetLimits";
import { useNetWorth } from "@/hooks/useNetWorth";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { useGoals } from "@/hooks/useGoals";
import { formatMonth, formatINR } from "@repo/shared/utils";
import { groupInvestmentsBySymbol, summarizeHoldings } from "@repo/shared/logic";
import { PageHeader } from "@/components/common/PageHeader";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Overall Report Suite Hub Screen
 */
export default function OverallReportScreen() {
  const { theme } = useTheme();
  const currentMonth = formatMonth(new Date());
  const { data: budgetLimits, isLoading: budgetsLoading } = useBudgetLimits();
  const { netSavings, isLoading: overviewLoading } = useMonthlyOverview(currentMonth);
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
    { title: "Monthly Summary", stat: `Net: ${formatINR(netSavings)}`, href: "/monthly-summary-report" },
    { title: "Net Worth Statement", stat: formatINR(netWorth?.netWorth ?? 0), href: "/net-worth-report" },
    { title: "Portfolio Holdings", stat: formatINR(portfolioSummary?.currentValue ?? 0), href: "/portfolio" },
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader showBack />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Overall Reports Suite"
          description="Direct access to all analytical statements and reports"
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}

        <View className="gap-2.5">
          {reportsList.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => router.push(item.href as any)}
            >
              <Card variant="outlined" className="p-4 flex-row items-center justify-between active:bg-surface-container-highest">
                <View className="gap-0.5">
                  <AppText className="text-sm font-semibold text-foreground">{item.title}</AppText>
                  <AppText className="text-xs text-primary font-medium">{item.stat}</AppText>
                </View>
                <ChevronRight size={18} color={theme.mutedForeground} />
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
