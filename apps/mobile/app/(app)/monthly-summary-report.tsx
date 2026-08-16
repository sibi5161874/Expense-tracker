import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingUp, TrendingDown, PiggyBank, Percent } from "lucide-react-native";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { formatMonth } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { KpiGrid, type KpiStatItem } from "@/components/dashboard/KpiGrid";
import { CashFlowBars } from "@/components/dashboard/CashFlowBars";
import { ReportExportBar } from "@/components/reports/ReportExportBar";
import { useThemeColor } from "@/lib/colors";

const DESCRIPTION = "Income, expense, and savings for the current month.";

export default function MonthlySummaryReportScreen() {
  const currentMonth = formatMonth(new Date());
  const { income, expense, netSavings, savingsRate, isLoading, error } = useMonthlyOverview(currentMonth);
  const primary = useThemeColor("primary");

  const kpis: KpiStatItem[] = [
    { label: "Income", value: income, icon: TrendingUp, tone: "success" },
    { label: "Expense", value: expense, icon: TrendingDown, tone: "destructive" },
    { label: "Net Savings", value: netSavings, icon: PiggyBank, tone: netSavings >= 0 ? "success" : "destructive" },
    { label: "Savings Rate", value: `${savingsRate.toFixed(1)}%`, icon: Percent, tone: "info" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader title="Monthly Summary" description={`Income, expense, and savings for ${currentMonth}.`} />
        <ReportExportBar
          title="Monthly Summary"
          description={DESCRIPTION}
          sheets={[
            {
              name: "Monthly Summary",
              rows: [
                { Metric: "Income", Value: income },
                { Metric: "Expense", Value: expense },
                { Metric: "Net Savings", Value: netSavings },
                { Metric: "Savings Rate (%)", Value: Number(savingsRate.toFixed(2)) },
              ],
            },
          ]}
        />
        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : (
          <>
            <KpiGrid items={kpis} />
            <View className="gap-3 rounded-2xl bg-card p-4">
              <AppText className="text-sm font-semibold">Income vs Expense</AppText>
              <CashFlowBars data={[{ label: currentMonth, income, expense }]} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
