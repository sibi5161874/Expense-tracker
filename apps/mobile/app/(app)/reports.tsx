import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const REPORTS = [
  { href: "/net-worth-report", label: "Net Worth History" },
  { href: "/capital-gains-report", label: "Capital Gains (ITR-ready)" },
  { href: "/spending-trend-report", label: "Spending Trends" },
  { href: "/category-breakdown-report", label: "Category Breakdown" },
  { href: "/monthly-summary-report", label: "Monthly Summary" },
  { href: "/budget-vs-actual-report", label: "Budget vs. Actual" },
  { href: "/account-flow-report", label: "Account Cash Flow" },
  { href: "/asset-allocation-report", label: "Asset Allocation" },
  { href: "/dividend-income-report", label: "Dividend Income" },
  { href: "/best-worst-performers-report", label: "Best & Worst Performers" },
  { href: "/cashbook-net-position-report", label: "Cashbook Net Position" },
  { href: "/asset-maturity-calendar-report", label: "Asset Maturity Calendar" },
  { href: "/goal-progress-report", label: "Goal Progress Report" },
  { href: "/xirr-report", label: "Portfolio XIRR" },
  { href: "/year-in-review-report", label: "Year in Review" },
  { href: "/overall-report", label: "Consolidated Financial Health" },
];

/**
 * Headless Reports Hub Container
 * Pure functional navigation directory for all 16 tax and analytical reports.
 */
export default function ReportsHubScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Reports Hub</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>16 comprehensive financial and tax reports</Text>
        </View>

        <View style={{ gap: 8, marginTop: 8 }}>
          {REPORTS.map((r) => (
            <Pressable
              key={r.href}
              onPress={() => router.push(r.href as any)}
              style={{
                padding: 14,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 6,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "500" }}>{r.label}</Text>
              <Text style={{ color: "#9ca3af" }}>&rarr;</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
