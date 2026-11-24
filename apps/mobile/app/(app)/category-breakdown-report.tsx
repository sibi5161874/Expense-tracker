import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PieChart } from "lucide-react-native";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { formatMonth, formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Category Breakdown Report Screen
 */
export default function CategoryBreakdownReportScreen() {
  const { theme } = useTheme();
  const currentMonth = formatMonth(new Date());
  const { categoryBreakdown, expense, isLoading, error } = useMonthlyOverview(currentMonth);

  const sortedCategories = useMemo(
    () => [...categoryBreakdown].sort((a, b) => b.value - a.value),
    [categoryBreakdown]
  );

  const sheets = useMemo(
    () => [
      {
        name: "Category Breakdown",
        headers: ["Category", "Amount (INR)", "Share (%)"],
        rows: sortedCategories.map((c) => ({
          Category: c.name,
          "Amount (INR)": c.value,
          "Share (%)": expense > 0 ? `${((c.value / expense) * 100).toFixed(1)}%` : "0%",
        })),
      },
    ],
    [sortedCategories, expense]
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
          title="Category Breakdown"
          description={`Where your money went in ${currentMonth}`}
        />

        <ReportExportBar
          title={`Category Breakdown - ${currentMonth}`}
          description={`Categorized expense breakdown for ${currentMonth}`}
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        <Card variant="elevated" className="p-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <PieChart size={20} color={theme.primary} />
            <AppText className="text-sm font-semibold text-foreground">Total Expenses</AppText>
          </View>
          <AmountText value={expense} sign="negative" className="text-lg font-bold" />
        </Card>

        <View className="gap-2.5">
          {sortedCategories.map((c) => {
            const pct = expense > 0 ? (c.value / expense) * 100 : 0;
            return (
              <Card key={c.name} variant="outlined" className="p-4 gap-2">
                <View className="flex-row items-center justify-between">
                  <AppText className="text-sm font-semibold text-foreground">{c.name}</AppText>
                  <AmountText value={c.value} sign="negative" className="text-sm font-bold" />
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-3 h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                    />
                  </View>
                  <AppText className="text-xs text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                    {pct.toFixed(1)}%
                  </AppText>
                </View>
              </Card>
            );
          })}

          {!isLoading && sortedCategories.length === 0 && (
            <Card variant="outlined" className="p-6 items-center justify-center">
              <AppText className="text-sm text-muted-foreground">No expenses recorded this month.</AppText>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
