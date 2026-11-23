import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactionsInRange, yearRange } from "@/hooks/useReportsData";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Headless Year in Review Report Container
 */
export default function YearInReviewReportScreen() {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Year in Review — {year}</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Annual cash flow totals, peak expense month, and top categories</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        {/* Summary KPIs */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>Total Income:</Text>
            <Text style={{ fontWeight: "bold", color: "#16a34a" }}>₹{totals.income.toLocaleString("en-IN")}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>Total Expenses:</Text>
            <Text style={{ fontWeight: "bold", color: "#dc2626" }}>₹{totals.expense.toLocaleString("en-IN")}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>Biggest Spending Month:</Text>
            <Text style={{ fontWeight: "600" }}>{biggestMonth && biggestMonth.expense > 0 ? `${biggestMonth.label} (₹${biggestMonth.expense.toLocaleString("en-IN")})` : "-"}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>Top Expense Category:</Text>
            <Text style={{ fontWeight: "600" }}>{topCategory ? `${topCategory[0]} (₹${topCategory[1].toLocaleString("en-IN")})` : "-"}</Text>
          </View>
        </View>

        {/* Monthly Breakdown */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>Monthly Breakdown</Text>
          {chartData.map((m) => (
            <View
              key={m.label}
              style={{
                padding: 10,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 6,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "bold" }}>{m.label}</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>
                In: +₹{m.income.toLocaleString("en-IN")} &bull; Out: -₹{m.expense.toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
