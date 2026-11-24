import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Award, TrendingUp, TrendingDown, Calendar } from "lucide-react-native";
import { useTransactionsInRange, yearRange } from "@/hooks/useReportsData";
import { formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Material 3 Year in Review Report Screen
 */
export default function YearInReviewReportScreen() {
  const { theme } = useTheme();
  const year = new Date().getFullYear();
  const { from, to } = yearRange(year);
  const { data: transactions, isLoading, error } = useTransactionsInRange(from, to);

  const { chartData, totals, biggestMonth, topCategory } = useMemo(() => {
    const monthly = MONTH_LABELS.map((label, i) => ({ label, monthIndex: i, income: 0, expense: 0 }));
    const categoryTotals = new Map<string, number>();
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions ?? []) {
      const monthIndex = Number(t.date.slice(5, 7)) - 1;
      const bucket = monthly[monthIndex];
      if (!bucket) continue;
      if (t.type === "Income") {
        bucket.income += t.amount;
        totalIncome += t.amount;
      } else if (t.type === "Expense") {
        bucket.expense += t.amount;
        totalExpense += t.amount;
        const name = t.category?.name ?? "Uncategorized";
        categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + t.amount);
      }
    }

    const biggestMonth = [...monthly].sort((a, b) => b.expense - a.expense)[0];
    const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      chartData: monthly,
      totals: { income: totalIncome, expense: totalExpense },
      biggestMonth,
      topCategory,
    };
  }, [transactions]);

  const sheets = useMemo(
    () => [
      {
        name: `Year in Review ${year}`,
        headers: ["Month", "Income (INR)", "Expense (INR)", "Net Savings (INR)"],
        rows: chartData.map((m) => ({
          Month: m.label,
          "Income (INR)": m.income,
          "Expense (INR)": m.expense,
          "Net Savings (INR)": m.income - m.expense,
        })),
      },
    ],
    [chartData, year]
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
          title={`Year in Review — ${year}`}
          description="Annual cash flow totals, peak expense month, and top categories"
        />

        <ReportExportBar
          title={`Year in Review ${year}`}
          description={`Full calendar year performance and financial retrospective`}
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        {/* Annual KPI Card */}
        <Card variant="elevated" className="p-5 gap-3.5">
          <View className="flex-row items-center gap-2">
            <Award size={22} color={theme.primary} />
            <AppText className="text-base font-bold text-foreground">Annual Highlights</AppText>
          </View>

          <View className="gap-2.5">
            <View className="flex-row justify-between items-center">
              <AppText className="text-sm text-muted-foreground">Total Income</AppText>
              <AmountText value={totals.income} sign="positive" className="text-base font-bold" />
            </View>
            <View className="flex-row justify-between items-center">
              <AppText className="text-sm text-muted-foreground">Total Expenses</AppText>
              <AmountText value={totals.expense} sign="negative" className="text-base font-bold" />
            </View>
            <View className="flex-row justify-between items-center pt-2 border-t border-border/50">
              <AppText className="text-sm text-muted-foreground">Biggest Spending Month</AppText>
              <AppText className="text-sm font-semibold text-foreground">
                {biggestMonth && biggestMonth.expense > 0 ? `${biggestMonth.label} (${formatINR(biggestMonth.expense)})` : "-"}
              </AppText>
            </View>
            <View className="flex-row justify-between items-center">
              <AppText className="text-sm text-muted-foreground">Top Expense Category</AppText>
              <AppText className="text-sm font-semibold text-foreground">
                {topCategory ? `${topCategory[0]} (${formatINR(topCategory[1])})` : "-"}
              </AppText>
            </View>
          </View>
        </Card>

        {/* Monthly Breakdown */}
        <View className="gap-2.5">
          <AppText className="text-sm font-bold text-foreground">Monthly Ledger</AppText>

          {chartData.map((m) => (
            <Card key={m.label} variant="outlined" className="p-3.5 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5">
                <View className="size-8 rounded-full bg-surface-container-highest items-center justify-center">
                  <AppText className="text-xs font-bold text-foreground">{m.label}</AppText>
                </View>
                <View className="gap-0.5">
                  <AppText className="text-xs text-muted-foreground">
                    In: +{formatINR(m.income)}
                  </AppText>
                  <AppText className="text-xs text-muted-foreground">
                    Out: -{formatINR(m.expense)}
                  </AppText>
                </View>
              </View>
              <AmountText value={m.income - m.expense} className="text-sm font-bold" />
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
