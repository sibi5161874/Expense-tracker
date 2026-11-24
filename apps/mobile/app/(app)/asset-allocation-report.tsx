import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PieChart, Layers } from "lucide-react-native";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { groupInvestmentsBySymbol } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Asset Allocation Report Screen
 */
export default function AssetAllocationReportScreen() {
  const { theme } = useTheme();
  const { data: investments, isLoading, error } = useAllInvestmentLog();

  const holdings = useMemo(() => (investments ? groupInvestmentsBySymbol(investments) : []), [investments]);
  const totalValuation = useMemo(() => holdings.reduce((sum, h) => sum + h.currentValue, 0), [holdings]);

  const byAssetType = useMemo(() => {
    const totals = new Map<string, number>();
    for (const h of holdings) totals.set(h.assetType, (totals.get(h.assetType) ?? 0) + h.currentValue);
    return Array.from(totals, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [holdings]);

  const byHolding = useMemo(
    () => holdings.map((h) => ({ name: h.symbol, value: h.currentValue })).sort((a, b) => b.value - a.value),
    [holdings]
  );

  const sheets = useMemo(
    () => [
      {
        name: "By Asset Type",
        headers: ["Asset Type", "Current Value (INR)", "Share (%)"],
        rows: byAssetType.map((item) => ({
          "Asset Type": item.name,
          "Current Value (INR)": item.value,
          "Share (%)": totalValuation > 0 ? `${((item.value / totalValuation) * 100).toFixed(1)}%` : "0%",
        })),
      },
      {
        name: "By Individual Holding",
        headers: ["Holding Symbol", "Current Value (INR)", "Share (%)"],
        rows: byHolding.map((item) => ({
          "Holding Symbol": item.name,
          "Current Value (INR)": item.value,
          "Share (%)": totalValuation > 0 ? `${((item.value / totalValuation) * 100).toFixed(1)}%` : "0%",
        })),
      },
    ],
    [byAssetType, byHolding, totalValuation]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Asset Allocation"
          description="Portfolio split by asset type and holding"
        />

        <ReportExportBar
          title="Asset Allocation Statement"
          description="Detailed breakdown of portfolio asset weightings"
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        {/* By Asset Type */}
        <Card variant="elevated" className="p-5 gap-3.5">
          <View className="flex-row items-center gap-2">
            <PieChart size={20} color={theme.primary} />
            <AppText className="text-base font-bold text-foreground">By Asset Type</AppText>
          </View>

          <View className="gap-2.5">
            {byAssetType.map((item) => {
              const pct = totalValuation > 0 ? (item.value / totalValuation) * 100 : 0;
              return (
                <View key={item.name} className="gap-1">
                  <View className="flex-row justify-between items-center">
                    <AppText className="text-sm font-medium text-foreground">{item.name}</AppText>
                    <AppText className="text-sm font-semibold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                      {formatINR(item.value)}
                    </AppText>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                      <View
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                      />
                    </View>
                    <AppText className="text-xs text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                      {pct.toFixed(1)}%
                    </AppText>
                  </View>
                </View>
              );
            })}

            {!isLoading && byAssetType.length === 0 && (
              <AppText className="text-sm text-muted-foreground">No asset types recorded yet.</AppText>
            )}
          </View>
        </Card>

        {/* By Holding */}
        <Card variant="outlined" className="p-5 gap-3.5">
          <View className="flex-row items-center gap-2">
            <Layers size={20} color={theme.primary} />
            <AppText className="text-base font-bold text-foreground">By Individual Holding</AppText>
          </View>

          <View className="gap-2.5">
            {byHolding.map((item) => (
              <View key={item.name} className="flex-row justify-between items-center py-1 border-b border-border/40">
                <AppText className="text-sm font-medium text-foreground">{item.name}</AppText>
                <AppText className="text-sm font-semibold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                  {formatINR(item.value)}
                </AppText>
              </View>
            ))}

            {!isLoading && byHolding.length === 0 && (
              <AppText className="text-sm text-muted-foreground">No holdings recorded yet.</AppText>
            )}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
