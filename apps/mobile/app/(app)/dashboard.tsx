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
  ChevronRight,
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

function getSavingsRateTone(rate: number): "success" | "warning" | "destructive" {
  if (rate >= 20) return "success";
  if (rate > 0) return "warning";
  return "destructive";
}

/**
 * Awwwards-Craft Dashboard Screen.
 * High-contrast slate obsidian surfaces, tactile interactions,
 * strict tabular numbers, and rich financial telemetry.
 */
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

  const isLoading = overviewLoading || netWorthLoading;
  const error = overviewError || netWorthError;

  const handleHeroItemPress = (key: string) => {
    if (key === "cashAndBankTotal") {
      router.push("/transactions");
    } else if (key === "portfolioValue") {
      router.push("/portfolio");
    } else if (key === "liabilitiesTotal") {
      router.push("/assets");
    }
  };

  const kpiItems: KpiStatItem[] = [
    {
      label: "Income",
      icon: ArrowUpRight,
      tone: "success",
      value: monthlyIncome,
      onPress: () => router.push("/transactions"),
    },
    {
      label: "Expenses",
      icon: ArrowDownRight,
      tone: "destructive",
      value: monthlyExpense,
      onPress: () => router.push("/transactions"),
    },
    {
      label: "Net Savings",
      icon: Wallet,
      tone: netSavings >= 0 ? "success" : "destructive",
      value: netSavings,
      onPress: () => router.push("/transactions"),
    },
    {
      label: "Savings Rate",
      icon: TrendingUp,
      tone: getSavingsRateTone(savingsRate),
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
          <View className="gap-0.5">
            <AppText className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </AppText>
            <AppText className="text-xs font-medium text-muted-foreground">
              Period: {currentMonth}
            </AppText>
          </View>

          {/* Tactile AI Assistant Pill Button */}
          <Pressable
            onPress={() => setAiChatOpen(true)}
            className="flex-row items-center gap-2 rounded-full border border-border/70 px-4 py-2 shadow-sm active:scale-95 active:opacity-90"
            style={{
              backgroundColor: theme.primaryContainer || theme.card,
            }}
          >
            <Sparkles size={15} color={theme.onPrimaryContainer || theme.primary} />
            <AppText
              className="text-xs font-bold"
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
            className="rounded-2xl border p-4 shadow-sm"
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
            <NetWorthHero
              breakdown={netWorth}
              onPressItem={handleHeroItemPress}
            />
          </Card>
        )}

        {/* Historical Net Worth Chart */}
        <HistoricalNetWorthChart />

        {/* Monthly Cash Flow KPIs */}
        <View className="gap-2.5">
          <View className="flex-row items-center justify-between px-1">
            <AppText className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Monthly Cash Flow
            </AppText>
            <Pressable
              onPress={() => router.push("/transactions")}
              className="flex-row items-center gap-0.5 active:opacity-75"
            >
              <AppText className="text-xs font-semibold text-primary">
                View All
              </AppText>
              <ChevronRight size={13} color={theme.primary} />
            </Pressable>
          </View>
          <KpiGrid items={kpiItems} />
          <BudgetHealthCard />
        </View>

        {/* Financial Essentials (Emergency fund, score) */}
        <FinancialEssentialsCard />

        {/* Category Breakdown Card */}
        {categoryBreakdown && categoryBreakdown.length > 0 && (
          <Card variant="outlined" className="gap-4">
            <View className="flex-row items-center justify-between">
              <AppText className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Expense Distribution
              </AppText>
              <Pressable
                onPress={() => router.push("/reports")}
                className="flex-row items-center gap-0.5 active:opacity-75"
              >
                <AppText className="text-xs font-semibold text-primary">
                  Breakdown
                </AppText>
                <ChevronRight size={13} color={theme.primary} />
              </Pressable>
            </View>
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
