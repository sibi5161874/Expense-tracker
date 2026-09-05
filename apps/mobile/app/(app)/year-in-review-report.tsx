import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingUp, TrendingDown, Calendar, Tag } from "lucide-react-native";
import { useTransactionsInRange, yearRange } from "@/hooks/useReportsData";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { KpiGrid, type KpiStatItem } from "@/components/dashboard/KpiGrid";
import { CashFlowBars } from "@/components/dashboard/CashFlowBars";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useThemeColor } from "@/lib/colors";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function YearInReviewReportScreen() {
  const year = new Date().getFullYear();
  const { from, to } = yearRange(year);
  const { data: transactions, isLoading, error } = useTransactionsInRange(from, to);
  const primary = useThemeColor("primary");

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

  const kpis: KpiStatItem[] = [
    { label: "Total Income", value: totals.income, icon: TrendingUp, tone: "success" },
    { label: "Total Expense", value: totals.expense, icon: TrendingDown, tone: "destructive" },
    { label: "Biggest Month", value: biggestMonth && biggestMonth.expense > 0 ? biggestMonth.label : "-", icon: Calendar, tone: "info" },
    { label: "Top Category", value: topCategory?.[0] ?? "-", icon: Tag, tone: "warning" },
  ];

  const sheets = [
    {
      name: "Year in Review",
      rows: chartData.map((m) => ({ Month: m.label, Income: m.income, Expense: m.expense })),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader title="Year in Review" description={`${year} totals, biggest month, and top category.`} />
        {!isLoading && (
          <ReportExportBar title="Year in Review" description={`${year} totals, biggest month, and top category.`} sheets={sheets} />
        )}
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
              <AppText className="text-sm font-semibold">Monthly Totals — {year}</AppText>
              <CashFlowBars data={chartData} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
