import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactionsInRange, monthsAgo } from "@/hooks/useReportsData";
import { formatMonth } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { CategoryBarList } from "@/components/dashboard/CategoryBarList";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useThemeColor } from "@/lib/colors";

const MONTHS_BACK = 6;

/** Mobile equivalent of SpendingTrendReport.tsx. Web shows one stacked area chart across
 * 6 months; RN has no stacked-area chart primitive available, so this shows the same top-5
 * category data as a per-month breakdown list instead — same underlying numbers, laid out
 * as 6 stacked sections rather than one chart. */
export default function SpendingTrendReportScreen() {
  const from = monthsAgo(MONTHS_BACK - 1);
  const to = formatMonth(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)) + "-01";
  const { data: transactions, isLoading, error } = useTransactionsInRange(from, to);
  const primary = useThemeColor("primary");

  const monthlyBreakdowns = useMemo(() => {
    const expenses = (transactions ?? []).filter((t) => t.type === "Expense");
    const months: string[] = [];
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const d = new Date();
      months.push(formatMonth(new Date(d.getFullYear(), d.getMonth() - i, 1)));
    }
    return months.map((month) => {
      const totals = new Map<string, number>();
      for (const t of expenses) {
        if (!t.date.startsWith(month)) continue;
        const name = t.category?.name ?? "Uncategorized";
        totals.set(name, (totals.get(name) ?? 0) + t.amount);
      }
      return { month, data: Array.from(totals, ([name, value]) => ({ name, value })) };
    });
  }, [transactions]);

  const sheets = [
    {
      name: "Spending Trend",
      rows: monthlyBreakdowns.flatMap(({ month, data }) => data.map((d) => ({ Month: month, Category: d.name, Amount: d.value }))),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader title="Spending Trend" description={`Top expense categories over the last ${MONTHS_BACK} months.`} />
        {!isLoading && (
          <ReportExportBar
            title="Spending Trend"
            description={`Top expense categories over the last ${MONTHS_BACK} months.`}
            sheets={sheets}
          />
        )}
        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : (
          monthlyBreakdowns.map(({ month, data }) => (
            <View key={month} className="gap-3 rounded-2xl bg-card p-4">
              <AppText className="text-sm font-semibold">{month}</AppText>
              <CategoryBarList data={data} />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
