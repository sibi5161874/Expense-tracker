import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { groupInvestmentsBySymbol } from "@repo/shared/logic";

/**
 * Headless Best/Worst Performers Report Container
 */
export default function BestWorstPerformersReportScreen() {
  const { data: investments, isLoading, error } = useAllInvestmentLog();

  const holdings = useMemo(() => {
    const grouped = investments ? groupInvestmentsBySymbol(investments) : [];
    return [...grouped]
      .sort((a, b) => b.returnPct - a.returnPct)
      .map((h) => ({ symbol: h.symbol, returnPct: Number((h.returnPct * 100).toFixed(2)) }));
  }, [investments]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Best/Worst Performers</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Holdings ranked by unrealised return %</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        <View style={{ gap: 8 }}>
          {holdings.map((h) => (
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
              <Text
                style={{
                  fontWeight: "bold",
                  color: h.returnPct >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {h.returnPct >= 0 ? "+" : ""}{h.returnPct}%
              </Text>
            </View>
          ))}
          {!isLoading && holdings.length === 0 && (
            <Text style={{ color: "#6b7280" }}>No holdings found.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
