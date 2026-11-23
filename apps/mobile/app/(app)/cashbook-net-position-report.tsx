import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCashbook } from "@/hooks/useCashbook";

/**
 * Headless Cashbook Net Position Report Container
 */
export default function CashbookNetPositionReportScreen() {
  const { summary, isLoading, error } = useCashbook();
  const rows = summary ? Object.entries(summary) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Cashbook Net Position</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Counterparty debt balances and overdue status</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        <View style={{ gap: 8 }}>
          {rows.map(([counterparty, item]) => (
            <View
              key={counterparty}
              style={{
                padding: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 6,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ gap: 2 }}>
                <Text style={{ fontWeight: "600" }}>{counterparty}</Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                  Given: ₹{item.totalGiven.toLocaleString("en-IN")} &bull; Received: ₹{item.totalReceived.toLocaleString("en-IN")} {item.hasOverdue ? "• (Overdue)" : ""}
                </Text>
              </View>
              <Text
                style={{
                  fontWeight: "bold",
                  color: item.netBalance >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                ₹{item.netBalance.toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
          {!isLoading && rows.length === 0 && (
            <Text style={{ color: "#6b7280" }}>No cashbook entries found.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
