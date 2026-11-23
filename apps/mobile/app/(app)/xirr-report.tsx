import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { computePortfolioXirr, groupInvestmentsBySymbol } from "@repo/shared/logic";

/**
 * Headless XIRR Return Analysis Container
 */
export default function XirrReportScreen() {
  const { data: investments, isLoading: isLogsLoading, error: logsError } = useAllInvestmentLog();
  const { data: holdingRows, isLoading: isHoldingsLoading, error: holdingsError } = useHoldings();

  const report = useMemo(() => {
    const livePriceOverrides = Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price]));
    const computedHoldings = investments ? groupInvestmentsBySymbol(investments, livePriceOverrides) : [];
    const holdingsData = computedHoldings.map((h) => ({
      symbol: h.symbol,
      shares: h.unitsHeld,
      current_price: h.currentPrice,
      current_value: h.currentValue,
    }));

    return computePortfolioXirr(investments ?? [], holdingsData);
  }, [investments, holdingRows]);

  const isLoading = isLogsLoading || isHoldingsLoading;
  const error = logsError || holdingsError;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>XIRR Return Analysis</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Annualized internal rate of return across all cash flows</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        {/* Portfolio XIRR Banner */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
            Overall Portfolio XIRR
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "bold" }}>
            {report.portfolioXirrPct !== null
              ? `${report.portfolioXirrPct >= 0 ? "+" : ""}${report.portfolioXirrPct.toFixed(2)}% p.a.`
              : "N/A"}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f3f4f6" }}>
            <View>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Total Invested</Text>
              <Text style={{ fontSize: 16, fontWeight: "600" }}>₹{report.totalInvested.toLocaleString("en-IN")}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Current Value</Text>
              <Text style={{ fontSize: 16, fontWeight: "600" }}>₹{report.currentPortfolioValue.toLocaleString("en-IN")}</Text>
            </View>
          </View>
        </View>

        {/* Holdings XIRR Breakdown */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>Holdings XIRR ({report.holdings.length})</Text>
          {report.holdings.map((h) => (
            <View
              key={h.symbol}
              style={{ padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, gap: 4 }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "bold" }}>{h.symbol}</Text>
                <Text
                  style={{
                    fontWeight: "bold",
                    color: h.xirrPct != null && h.xirrPct >= 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  {h.xirrPct != null ? `${h.xirrPct.toFixed(2)}% p.a.` : "N/A"}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>
                Invested: ₹{h.totalInvested.toLocaleString("en-IN")} &bull; Current: ₹{h.currentValue.toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
          {!isLoading && report.holdings.length === 0 && (
            <Text style={{ color: "#6b7280" }}>No investment cash flows recorded yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
