import { ScrollView, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingUp, TrendingDown, PiggyBank, Percent, Sparkles } from "lucide-react-native";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { useMonthlyTrend } from "@/hooks/useMonthlyTrend";
import { useNetWorth } from "@/hooks/useNetWorth";
import { formatMonth } from "@repo/shared/utils";
import { AppText } from "@/components/common/AppText";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { NetWorthHero } from "@/components/dashboard/NetWorthHero";
import { KpiGrid, type KpiStatItem } from "@/components/dashboard/KpiGrid";
import { CashFlowBars } from "@/components/dashboard/CashFlowBars";
import { CategoryBarList } from "@/components/dashboard/CategoryBarList";
import { useThemeColor } from "@/lib/colors";

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
  const primary = useThemeColor("primary");

  const isLoading = overviewLoading || trendLoading || netWorthLoading;
  const error = overviewError || netWorthError;

  const hasActivity = (trend ?? []).some((t) => t.income > 0 || t.expense > 0);

  const kpis: KpiStatItem[] = [
    { label: "Income This Month", value: monthlyIncome, icon: TrendingUp, tone: "success" },
    { label: "Expense This Month", value: monthlyExpense, icon: TrendingDown, tone: "destructive" },
    { label: "Net Savings", value: netSavings, icon: PiggyBank, tone: netSavings >= 0 ? "success" : "destructive" },
    { label: "Savings Rate", value: `${savingsRate.toFixed(1)}%`, icon: Percent, tone: "info" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 p-4 pb-32">
        <PageHeader title="Dashboard" description="Here's what's happening with your finances this month." />

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <Card>
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        ) : !hasActivity ? (
          <EmptyState
            icon={Sparkles}
            title="Your dashboard is ready"
            description="Log your first transaction to see income, expenses, and net worth come together here."
          />
        ) : (
          <>
            {netWorth && <NetWorthHero breakdown={netWorth} />}
            <KpiGrid items={kpis} />

            <Card>
              <AppText className="mb-4 text-sm font-semibold">Cash flow — last 6 months</AppText>
              <CashFlowBars data={trend ?? []} />
            </Card>

            <Card>
              <AppText className="mb-4 text-sm font-semibold">Expenses by category — this month</AppText>
              <CategoryBarList data={categoryBreakdown} />
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
