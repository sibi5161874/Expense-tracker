import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { computeCapitalGains } from "@repo/shared/logic";

/**
 * Headless Capital Gains Report Container
 */
export default function CapitalGainsReportScreen() {
  const { data: investments, isLoading, error } = useAllInvestmentLog();
  const [selectedFY, setSelectedFY] = useState<string>("all");

  const report = useMemo(() => {
    return computeCapitalGains(investments ?? []);
  }, [investments]);

  const { filteredTrades, activeSummary } = useMemo(() => {
    if (selectedFY === "all") {
      const totalProceeds = report.allTrades.reduce((sum, t) => sum + t.sellProceeds, 0);
      const totalCost = report.allTrades.reduce((sum, t) => sum + t.buyCost, 0);
      const stcgTrades = report.allTrades.filter((t) => t.taxType === "STCG");
      const ltcgTrades = report.allTrades.filter((t) => t.taxType === "LTCG");

      const stcgGains = stcgTrades.filter((t) => t.gain >= 0).reduce((sum, t) => sum + t.gain, 0);
      const stcgLosses = stcgTrades.filter((t) => t.gain < 0).reduce((sum, t) => sum + Math.abs(t.gain), 0);
      const ltcgGains = ltcgTrades.filter((t) => t.gain >= 0).reduce((sum, t) => sum + t.gain, 0);
      const ltcgLosses = ltcgTrades.filter((t) => t.gain < 0).reduce((sum, t) => sum + Math.abs(t.gain), 0);

      return {
        filteredTrades: report.allTrades,
        activeSummary: {
          financialYear: "All Years",
          totalSellProceeds: totalProceeds,
          totalCostBasis: totalCost,
          stcgGains,
          stcgLosses,
          netStcg: stcgGains - stcgLosses,
          ltcgGains,
          ltcgLosses,
          netLtcg: ltcgGains - ltcgLosses,
          totalNetGains: stcgGains - stcgLosses + (ltcgGains - ltcgLosses),
        },
      };
    }

    const s = report.summariesByFY[selectedFY];
    return {
      filteredTrades: s ? s.trades : [],
      activeSummary: s ?? {
        financialYear: selectedFY,
        totalSellProceeds: 0,
        totalCostBasis: 0,
        stcgGains: 0,
        stcgLosses: 0,
        netStcg: 0,
        ltcgGains: 0,
        ltcgLosses: 0,
        netLtcg: 0,
        totalNetGains: 0,
      },
    };
  }, [report, selectedFY]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Capital Gains (STCG/LTCG)</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>FIFO realized gains & tax classification</Text>
        </View>

        {/* FY Selector Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => setSelectedFY("all")}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: selectedFY === "all" ? "#2563eb" : "#f3f4f6",
                borderRadius: 20,
              }}
            >
              <Text style={{ color: selectedFY === "all" ? "#ffffff" : "#000000", fontWeight: "600" }}>All Years</Text>
            </Pressable>
            {report.availableFYs.map((fy) => (
              <Pressable
                key={fy}
                onPress={() => setSelectedFY(fy)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: selectedFY === fy ? "#2563eb" : "#f3f4f6",
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: selectedFY === fy ? "#ffffff" : "#000000", fontWeight: "600" }}>{fy}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        {/* Summary KPIs */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>FY: {activeSummary.financialYear}</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>Total Realized P&L:</Text>
            <Text
              style={{
                fontWeight: "bold",
                color: activeSummary.totalNetGains >= 0 ? "#16a34a" : "#dc2626",
              }}
            >
              ₹{activeSummary.totalNetGains.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>STCG (Net):</Text>
            <Text style={{ fontWeight: "600" }}>₹{activeSummary.netStcg.toLocaleString("en-IN")}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>LTCG (Net):</Text>
            <Text style={{ fontWeight: "600" }}>₹{activeSummary.netLtcg.toLocaleString("en-IN")}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>Total Cost Basis:</Text>
            <Text style={{ fontWeight: "600" }}>₹{activeSummary.totalCostBasis.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        {/* Matched Trades List */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>Trades ({filteredTrades.length})</Text>
          {filteredTrades.map((t, idx) => (
            <View
              key={`${t.symbol}-${t.sellDate}-${idx}`}
              style={{ padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, gap: 4 }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "bold" }}>{t.symbol} ({t.taxType})</Text>
                <Text style={{ fontWeight: "bold", color: t.gain >= 0 ? "#16a34a" : "#dc2626" }}>
                  {t.gain >= 0 ? "+" : ""}₹{t.gain.toLocaleString("en-IN")}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>
                Buy: {t.buyDate} &bull; Sell: {t.sellDate} &bull; Held: {t.holdingDays}d &bull; Qty: {t.quantity}
              </Text>
            </View>
          ))}
          {!isLoading && filteredTrades.length === 0 && (
            <Text style={{ color: "#6b7280" }}>No realized trades found for this selection.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
