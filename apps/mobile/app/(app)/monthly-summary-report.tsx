import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { formatMonth } from "@repo/shared/utils";

/**
 * Headless Monthly Summary Report Container
 */
export default function MonthlySummaryReportScreen() {
  const currentMonth = formatMonth(new Date());
  const { income, expense, netSavings, savingsRate, isLoading, error } = useMonthlyOverview(currentMonth);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Monthly Summary</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Income, expense, and savings for {currentMonth}</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>Total Income:</Text>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#16a34a" }}>₹{income.toLocaleString("en-IN")}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>Total Expenses:</Text>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#dc2626" }}>₹{expense.toLocaleString("en-IN")}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>Net Savings:</Text>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>₹{netSavings.toLocaleString("en-IN")}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>Savings Rate:</Text>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{savingsRate.toFixed(1)}%</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
