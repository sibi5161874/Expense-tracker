import { useMemo, useState } from "react";
import { ScrollView, View, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Sparkles,
  ArrowRight,
  PieChart,
  BookOpen,
  FileText,
} from "lucide-react-native";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { useMonthlyTrend } from "@/hooks/useMonthlyTrend";
import { useNetWorth } from "@/hooks/useNetWorth";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { useGoals } from "@/hooks/useGoals";
import { useCashbook } from "@/hooks/useCashbook";
import { formatMonth, formatINR } from "@repo/shared/utils";
import { groupInvestmentsBySymbol } from "@repo/shared/logic";

import { AppText } from "@/components/common/AppText";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { AmountText } from "@/components/common/AmountText";
import { NetWorthHero } from "@/components/dashboard/NetWorthHero";
import { KpiGrid, type KpiStatItem } from "@/components/dashboard/KpiGrid";
import { FinancialEssentialsCard } from "@/components/dashboard/FinancialEssentialsCard";
import { QuickAddInput } from "@/components/dashboard/QuickAddInput";
import { AiChatSheet } from "@/components/shared/AiChatSheet";
import { AppHeader } from "@/components/common/AppHeader";
import { HistoricalNetWorthChart } from "@/components/dashboard/HistoricalNetWorthChart";
import { BudgetHealthCard } from "@/components/dashboard/BudgetHealthCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { useTheme } from "@/theme/ThemeProvider";

export default function DashboardScreen() {
  const { theme } = useTheme();
  const currentMonth = formatMonth(new Date());

  const [aiChatOpen, setAiChatOpen] = useState(false);

  const {
    income: monthlyIncome,
    expense: monthlyExpense,
    netSavings,
    savingsRate,
    categoryBreakdown,
    isLoading: overviewLoading,
    error: overviewError,
  } = useMonthlyOverview(currentMonth);

  const { data: trend } = useMonthlyTrend(6);
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

  const isLoading = overviewLoading || netWorthLoading;
  const error = overviewError || netWorthError;

  const kpiItems: KpiStatItem[] = [
    {
      label: "Income",
      icon: ArrowUpRight,
      tone: "success",
      value: monthlyIncome,
    },
    {
      label: "Expenses",
      icon: ArrowDownRight,
      tone: "destructive",
      value: monthlyExpense,
    },
    {
      label: "Net Savings",
      icon: Wallet,
      tone: netSavings >= 0 ? "success" : "destructive",
      value: netSavings,
    },
    {
      label: "Savings Rate",
      icon: TrendingUp,
      tone: savingsRate >= 20 ? "success" : savingsRate > 0 ? "warning" : "destructive",
      value: `${savingsRate.toFixed(1)}%`,
    },
  ];

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 96,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header with Greeting and AI Trigger */}
        <View className="flex-row items-center justify-between">
          <View>
            <AppText className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </AppText>
            <AppText className="text-xs text-muted-foreground">
              Month: {currentMonth}
            </AppText>
          </View>

          {/* M3 Tonal AI Assistant Button */}
          <Pressable
            onPress={() => setAiChatOpen(true)}
            className="flex-row items-center gap-2 rounded-full px-3.5 py-2 shadow-sm"
            style={{
              backgroundColor: theme.primaryContainer || theme.secondaryContainer,
            }}
          >
            <Sparkles size={16} color={theme.onPrimaryContainer || theme.primary} />
            <AppText
              className="text-xs font-semibold"
              style={{ color: theme.onPrimaryContainer || theme.primary }}
            >
              Ask AI
            </AppText>
          </Pressable>
        </View>

        {/* Quick Add NLP Input */}
        <QuickAddInput />

        {isLoading && (
          <View className="py-2 items-center">
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}

        {error && (
          <View
            className="rounded-2xl border p-4"
            style={{
              backgroundColor: theme.destructiveSubtle || "#fee2e2",
              borderColor: theme.destructive,
            }}
          >
            <AppText className="text-xs text-destructive">
              {error.message || "Failed to load dashboard data"}
            </AppText>
          </View>
        )}

        {/* Net Worth Hero Card */}
        {netWorth && (
          <Card variant="elevated" className="gap-3">
            <NetWorthHero breakdown={netWorth} />
          </Card>
        )}

        {/* Historical Net Worth Chart */}
        <HistoricalNetWorthChart />

        {/* Monthly Cash Flow KPIs */}
        <View className="gap-2">
          <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Cash Flow ({currentMonth})
          </AppText>
          <KpiGrid items={kpiItems} />
          <BudgetHealthCard />
        </View>

        {/* Financial Essentials (Emergency fund, score) */}
        <FinancialEssentialsCard />

        {/* Category Breakdown Card */}
        {categoryBreakdown && categoryBreakdown.length > 0 && (
          <Card variant="outlined" className="gap-4">
            <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Expense Distribution
            </AppText>
            <DonutChart
              data={categoryBreakdown.map((cat) => ({ name: cat.name, value: cat.value }))}
              size={180}
              centerSubtitle="Monthly Spend"
            />
          </Card>
        )}
      </ScrollView>

      {/* Floating AI Assistant Modal Sheet */}
      <AiChatSheet
        visible={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
      />
    </SafeAreaView>
  );
}
