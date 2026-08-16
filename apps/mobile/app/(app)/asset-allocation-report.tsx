import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { groupInvestmentsBySymbol } from "@repo/shared/logic";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { CategoryBarList } from "@/components/dashboard/CategoryBarList";
import { ReportExportBar } from "@/components/reports/ReportExportBar";
import { useThemeColor } from "@/lib/colors";

export default function AssetAllocationReportScreen() {
  const { data: investments, isLoading, error } = useAllInvestmentLog();
  const primary = useThemeColor("primary");

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
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader title="Asset Allocation" description="Portfolio split by asset type and by individual holding." />
        <ReportExportBar
          title="Asset Allocation"
          description="Portfolio split by asset type and by individual holding."
          sheets={[
            { name: "By Asset Type", rows: byAssetType.map((a) => ({ "Asset Type": a.name, "Current Value": a.value })) },
            { name: "By Holding", rows: byHolding.map((h) => ({ Symbol: h.name, "Current Value": h.value })) },
          ]}
        />
        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : (
          <>
            <View className="gap-3 rounded-2xl bg-card p-4">
              <AppText className="text-sm font-semibold">By Asset Type</AppText>
              <CategoryBarList data={byAssetType} />
            </View>
            <View className="gap-3 rounded-2xl bg-card p-4">
              <AppText className="text-sm font-semibold">By Holding</AppText>
              <CategoryBarList data={byHolding} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
