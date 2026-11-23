import { useMemo } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { useRefreshPrices } from "@/hooks/useRefreshPrices";
import { groupInvestmentsBySymbol, summarizeHoldings } from "@repo/shared/logic";

/**
 * Headless Portfolio Container
 * Pure functional data container for portfolio valuation, holdings list, and live price refreshes.
 */
export default function PortfolioScreen() {
  const { data: allInvestments, isLoading, error } = useAllInvestmentLog();
  const { data: holdingRows } = useHoldings();
  const { refresh, isRefreshing } = useRefreshPrices();

  const livePriceOverrides = useMemo(
    () => Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price])),
    [holdingRows]
  );

  const holdings = useMemo(
    () => (allInvestments ? groupInvestmentsBySymbol(allInvestments, livePriceOverrides) : []),
    [allInvestments, livePriceOverrides]
  );

  const summary = useMemo(() => summarizeHoldings(holdings), [holdings]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        {/* Header & Refresh Action */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>Portfolio</Text>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>{holdings.length} Active Holdings</Text>
          </View>
          <Pressable
            disabled={isRefreshing}
            onPress={() => refresh()}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: isRefreshing ? "#9ca3af" : "#2563eb",
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>
              {isRefreshing ? "Refreshing..." : "Refresh Prices"}
            </Text>
          </Pressable>
        </View>

        {isLoading && <ActivityIndicator style={{ marginVertical: 16 }} />}

        {error && (
          <View style={{ padding: 12, backgroundColor: "#fee2e2", borderRadius: 6 }}>
            <Text style={{ color: "#b91c1c" }}>{error.message}</Text>
          </View>
        )}

        {/* Portfolio Valuation Summary Headless Section */}
        <View style={{ padding: 16, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, gap: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
            Valuation Overview
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Current Value</Text>
              <Text style={{ fontSize: 22, fontWeight: "bold" }}>
                ₹{summary.currentValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Total Invested</Text>
              <Text style={{ fontSize: 18, fontWeight: "600" }}>
                ₹{summary.totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f3f4f6" }}>
            <View>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Total P&L</Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: summary.totalPnl >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {summary.totalPnl >= 0 ? "+" : ""}₹{summary.totalPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Return %</Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: summary.pnlPercentage >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {summary.pnlPercentage >= 0 ? "+" : ""}{summary.pnlPercentage.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Headless Holdings List */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600" }}>Holdings Breakdown</Text>
          {holdings.length === 0 && !isLoading && (
            <Text style={{ color: "#6b7280" }}>No investment holdings recorded yet.</Text>
          )}
          {holdings.map((item, idx) => (
            <View
              key={idx}
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
                <Text style={{ fontWeight: "bold" }}>{item.symbol}</Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                  Qty: {item.unitsHeld} &bull; Avg: ₹{item.avgBuyPrice.toFixed(1)} &bull; Live: ₹{item.currentPrice.toFixed(1)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 2 }}>
                <Text style={{ fontWeight: "600" }}>₹{item.currentValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: item.unrealisedPnl >= 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  {item.unrealisedPnl >= 0 ? "+" : ""}{(item.returnPct * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
