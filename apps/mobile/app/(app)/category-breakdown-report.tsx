import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { formatMonth } from "@repo/shared/utils";

/**
 * Headless Category Breakdown Report Container
 */
export default function CategoryBreakdownReportScreen() {
  const currentMonth = formatMonth(new Date());
  const { categoryBreakdown, expense, isLoading, error } = useMonthlyOverview(currentMonth);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Category Breakdown</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Where your money went in {currentMonth}</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>Total Expenses: ₹{expense.toLocaleString("en-IN")}</Text>
          {categoryBreakdown
            .slice()
            .sort((a, b) => b.value - a.value)
            .map((c) => (
              <View
                key={c.name}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 6,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f3f4f6",
                }}
              >
                <Text style={{ fontSize: 14 }}>{c.name}</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 14, fontWeight: "600" }}>₹{c.value.toLocaleString("en-IN")}</Text>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>
                    {expense > 0 ? `${((c.value / expense) * 100).toFixed(1)}%` : "-"}
                  </Text>
                </View>
              </View>
            ))}
          {!isLoading && categoryBreakdown.length === 0 && (
            <Text style={{ color: "#6b7280" }}>No expenses recorded this month.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
