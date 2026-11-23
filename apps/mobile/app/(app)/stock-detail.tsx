import { useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { groupInvestmentsBySymbol } from "@repo/shared/logic";

/**
 * Headless Stock Detail Container
 */
export default function StockDetailScreen() {
  const { symbol: symbolParam } = useLocalSearchParams<{ symbol: string }>();
  const symbol = (symbolParam ?? "").toUpperCase();

  const { data: allInvestments, isLoading, error } = useAllInvestmentLog();
  const { data: holdingRows } = useHoldings();

  const livePriceOverrides = useMemo(
    () => Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price])),
    [holdingRows]
  );

  const holding = useMemo(() => {
    if (!allInvestments) return null;
    const holdings = groupInvestmentsBySymbol(allInvestments, livePriceOverrides);
    return holdings.find((h) => h.symbol.toUpperCase() === symbol) ?? null;
  }, [allInvestments, livePriceOverrides, symbol]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>{symbol || "Stock Detail"}</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Live quote & individual position analysis</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        {holding ? (
          <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>Units Held</Text>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>{holding.unitsHeld}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>Avg Buy Price</Text>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>₹{holding.avgBuyPrice.toFixed(2)}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>Live Market Price</Text>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>₹{holding.currentPrice.toFixed(2)}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>Total Current Value</Text>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>₹{holding.currentValue.toLocaleString("en-IN")}</Text>
              </View>
            </View>

            <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f3f4f6" }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Unrealized P&L</Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: holding.unrealisedPnl >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {holding.unrealisedPnl >= 0 ? "+" : ""}₹{holding.unrealisedPnl.toLocaleString("en-IN")} ({(holding.returnPct * 100).toFixed(2)}%)
              </Text>
            </View>
          </View>
        ) : (
          !isLoading && <Text style={{ color: "#6b7280" }}>No position found for {symbol}.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
