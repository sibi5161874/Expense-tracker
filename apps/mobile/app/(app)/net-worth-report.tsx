import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNetWorth } from "@/hooks/useNetWorth";

/**
 * Headless Net Worth Statement Report Container
 */
export default function NetWorthReportScreen() {
  const { data: netWorth, isLoading, error } = useNetWorth();

  const totalAssets = (netWorth?.netWorth ?? 0) + (netWorth?.liabilitiesTotal ?? 0);
  const totalLiabilities = netWorth?.liabilitiesTotal ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Net Worth Statement</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Assets, liabilities, and current equity</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 16, color: "#6b7280" }}>Total Assets</Text>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#16a34a" }}>
              ₹{totalAssets.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 16, color: "#6b7280" }}>Total Liabilities</Text>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#dc2626" }}>
              ₹{totalLiabilities.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f3f4f6", flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>Net Worth</Text>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>
              ₹{(netWorth?.netWorth ?? 0).toLocaleString("en-IN")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
