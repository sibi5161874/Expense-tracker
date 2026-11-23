import { useMemo } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useTransactionsForDate } from "@/hooks/useTransactions";

/**
 * Headless Transactions By Date Container
 */
export default function TransactionsByDateScreen() {
  const { date: dateParam } = useLocalSearchParams<{ date: string }>();
  const date = dateParam ?? "";
  const { data: transactions, isLoading, error } = useTransactionsForDate(date);

  const summary = useMemo(() => {
    const totalIn = (transactions ?? []).reduce((sum, t) => (t.type === "Income" ? sum + t.amount : sum), 0);
    const totalOut = (transactions ?? []).reduce((sum, t) => (t.type === "Expense" ? sum + t.amount : sum), 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [transactions]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", gap: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>{date || "Transactions on Date"}</Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Text style={{ color: "#16a34a", fontWeight: "600" }}>+₹{summary.totalIn.toLocaleString("en-IN")}</Text>
          <Text style={{ color: "#dc2626", fontWeight: "600" }}>-₹{summary.totalOut.toLocaleString("en-IN")}</Text>
          <Text style={{ fontWeight: "bold" }}>Net: ₹{summary.net.toLocaleString("en-IN")}</Text>
        </View>
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: 24 }} />}
      {error && <Text style={{ color: "#b91c1c", margin: 16 }}>{error.message}</Text>}

      <FlatList
        data={transactions ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 80 }}
        ListEmptyComponent={
          !isLoading ? <Text style={{ color: "#6b7280" }}>No transactions on this date.</Text> : null
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 6,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text style={{ fontWeight: "600" }}>{item.notes || "Uncategorized"}</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>{item.type}</Text>
            </View>
            <Text
              style={{
                fontWeight: "bold",
                color: item.type === "Income" ? "#16a34a" : "#dc2626",
              }}
            >
              {item.type === "Income" ? "+" : "-"}₹{Number(item.amount).toLocaleString("en-IN")}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
