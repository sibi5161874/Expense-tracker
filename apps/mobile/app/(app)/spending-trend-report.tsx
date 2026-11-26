import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingDown, Calendar } from "lucide-react-native";
import { useTransactionsInRange, monthsAgo } from "@/hooks/useReportsData";
import { formatMonth, formatINR } from "@repo/shared/utils";
import { isOperationalTransaction } from "@repo/shared/logic";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

const MONTHS_BACK = 6;

/**
 * Material 3 Spending Trend Report Screen
 */
export default function SpendingTrendReportScreen() {
  const { theme } = useTheme();
  const from = monthsAgo(MONTHS_BACK - 1);
  const to = formatMonth(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)) + "-01";
  const { data: transactions, isLoading, error } = useTransactionsInRange(from, to);

  const monthlyBreakdowns = useMemo(() => {
    const expenses = (transactions ?? []).filter((t) => t.type === "Expense" && isOperationalTransaction(t));
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

  const sheets = useMemo(
    () => [
      {
        name: "Monthly Spending Trend",
        headers: ["Month", "Category", "Amount (INR)"],
        rows: monthlyBreakdowns.flatMap(({ month, data }) =>
          data.map((cat) => ({
            Month: month,
            Category: cat.name,
            "Amount (INR)": cat.value,
          }))
        ),
      },
    ],
    [monthlyBreakdowns]
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
          title="Spending Trend"
          description={`Top expense categories over the last ${MONTHS_BACK} months`}
        />

        <ReportExportBar
          title="Spending Trend Analysis"
          description={`Historical category spending trend across ${MONTHS_BACK} months`}
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        <View className="gap-3">
          {monthlyBreakdowns.map(({ month, data }) => (
            <Card key={month} variant="outlined" className="p-4 gap-3">
              <View className="flex-row items-center gap-2">
                <Calendar size={18} color={theme.primary} />
                <AppText className="text-sm font-bold text-foreground">{month}</AppText>
              </View>

              <View className="gap-2">
                {data.map((cat) => (
                  <View key={cat.name} className="flex-row justify-between items-center py-0.5">
                    <AppText className="text-sm text-muted-foreground">{cat.name}</AppText>
                    <AmountText value={cat.value} sign="negative" className="text-sm font-semibold" />
                  </View>
                ))}

                {data.length === 0 && (
                  <AppText className="text-xs text-muted-foreground italic">No expenses recorded.</AppText>
                )}
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
