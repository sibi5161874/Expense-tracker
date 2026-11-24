import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowDownRight, ArrowUpRight, PiggyBank, Percent } from "lucide-react-native";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { formatMonth, formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Monthly Summary Report Screen
 */
export default function MonthlySummaryReportScreen() {
  const { theme } = useTheme();
  const currentMonth = formatMonth(new Date());
  const { income, expense, netSavings, savingsRate, isLoading, error } = useMonthlyOverview(currentMonth);

  const sheets = useMemo(
    () => [
      {
        name: "Monthly Summary",
        headers: ["Metric", "Amount / Value"],
        rows: [
          { Metric: "Month", "Amount / Value": currentMonth },
          { Metric: "Total Income", "Amount / Value": income },
          { Metric: "Total Expenses", "Amount / Value": expense },
          { Metric: "Net Savings", "Amount / Value": netSavings },
          { Metric: "Savings Rate (%)", "Amount / Value": `${savingsRate.toFixed(1)}%` },
        ],
      },
    ],
    [currentMonth, income, expense, netSavings, savingsRate]
  );

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
          title="Monthly Summary"
          description={`Income, expense, and savings for ${currentMonth}`}
        />

        <ReportExportBar
          title={`Monthly Summary - ${currentMonth}`}
          description={`Financial cash flow breakdown for ${currentMonth}`}
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        <Card variant="elevated" className="p-5 gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <ArrowUpRight size={18} color={theme.success} />
              <AppText className="text-sm text-muted-foreground">Total Income</AppText>
            </View>
            <AmountText value={income} sign="positive" className="text-lg font-bold" />
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <ArrowDownRight size={18} color={theme.destructive} />
              <AppText className="text-sm text-muted-foreground">Total Expenses</AppText>
            </View>
            <AmountText value={expense} sign="negative" className="text-lg font-bold" />
          </View>

          <View className="pt-3 border-t border-border/60 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <PiggyBank size={18} color={theme.primary} />
              <AppText className="text-base font-bold text-foreground">Net Savings</AppText>
            </View>
            <AmountText value={netSavings} className="text-xl font-bold" />
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Percent size={18} color={theme.primary} />
              <AppText className="text-sm text-muted-foreground">Savings Rate</AppText>
            </View>
            <AppText className="text-base font-bold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
              {savingsRate.toFixed(1)}%
            </AppText>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
