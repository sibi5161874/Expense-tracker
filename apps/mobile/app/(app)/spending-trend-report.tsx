import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactionsInRange, monthsAgo } from "@/hooks/useReportsData";
import { formatMonth } from "@repo/shared/utils";

const MONTHS_BACK = 6;

/**
 * Headless Spending Trend Report Container
 */
export default function SpendingTrendReportScreen() {
  const from = monthsAgo(MONTHS_BACK - 1);
  const to = formatMonth(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)) + "-01";
  const { data: transactions, isLoading, error } = useTransactionsInRange(from, to);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Spending Trend</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Top expense categories over the last {MONTHS_BACK} months</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        <View style={{ gap: 12 }}>
          {monthlyBreakdowns.map(({ month, data }) => (
            <View key={month} style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 14, gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: "bold" }}>{month}</Text>
              {data.map((cat) => (
                <View key={cat.name} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#4b5563" }}>{cat.name}</Text>
                  <Text style={{ fontWeight: "600" }}>₹{cat.value.toLocaleString("en-IN")}</Text>
                </View>
              ))}
              {data.length === 0 && <Text style={{ color: "#9ca3af", fontSize: 12 }}>No expenses recorded.</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
