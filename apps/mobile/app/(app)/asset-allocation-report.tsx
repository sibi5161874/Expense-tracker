import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { groupInvestmentsBySymbol } from "@repo/shared/logic";

/**
 * Headless Asset Allocation Report Container
 */
export default function AssetAllocationReportScreen() {
  const { data: investments, isLoading, error } = useAllInvestmentLog();

  const holdings = useMemo(() => (investments ? groupInvestmentsBySymbol(investments) : []), [investments]);
  const byAssetType = useMemo(() => {
    const totals = new Map<string, number>();
    for (const h of holdings) totals.set(h.assetType, (totals.get(h.assetType) ?? 0) + h.currentValue);
    return Array.from(totals, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [holdings]);
  const byHolding = useMemo(
    () => holdings.map((h) => ({ name: h.symbol, value: h.currentValue })).sort((a, b) => b.value - a.value),
    [holdings]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Asset Allocation</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Portfolio split by asset type and holding</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        {/* By Asset Type */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>By Asset Type</Text>
          {byAssetType.map((item) => (
            <View key={item.name} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
              <Text style={{ fontSize: 14 }}>{item.name}</Text>
              <Text style={{ fontSize: 14, fontWeight: "600" }}>₹{item.value.toLocaleString("en-IN")}</Text>
            </View>
          ))}
          {!isLoading && byAssetType.length === 0 && (
            <Text style={{ color: "#6b7280" }}>No asset types recorded yet.</Text>
          )}
        </View>

        {/* By Holding */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>By Holding</Text>
          {byHolding.map((item) => (
            <View key={item.name} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
              <Text style={{ fontSize: 14 }}>{item.name}</Text>
              <Text style={{ fontSize: 14, fontWeight: "600" }}>₹{item.value.toLocaleString("en-IN")}</Text>
            </View>
          ))}
          {!isLoading && byHolding.length === 0 && (
            <Text style={{ color: "#6b7280" }}>No holdings recorded yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
