import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";

/**
 * Headless Dividend Income Report Container
 */
export default function DividendIncomeReportScreen() {
  const { data: investments, isLoading, error } = useAllInvestmentLog();

  const { byHolding, total } = useMemo(() => {
    const dividends = (investments ?? []).filter((i) => i.action === "DIVIDEND");
    const holdingTotals = new Map<string, number>();
    for (const d of dividends) {
      holdingTotals.set(d.symbol, (holdingTotals.get(d.symbol) ?? 0) + d.price);
    }
    const byHolding = Array.from(holdingTotals, ([symbol, amount]) => ({ symbol, amount })).sort((a, b) => b.amount - a.amount);
    return { byHolding, total: dividends.reduce((sum, d) => sum + d.price, 0) };
  }, [investments]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Dividend Income</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Total dividends received: ₹{total.toLocaleString("en-IN")}</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        <View style={{ gap: 8 }}>
          {byHolding.map((h) => (
            <View
              key={h.symbol}
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
              <Text style={{ fontWeight: "600" }}>{h.symbol}</Text>
              <Text style={{ fontWeight: "bold", color: "#16a34a" }}>
                +₹{h.amount.toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
          {!isLoading && byHolding.length === 0 && (
            <Text style={{ color: "#6b7280" }}>No dividends recorded yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
