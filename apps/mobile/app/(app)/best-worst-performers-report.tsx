import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { groupInvestmentsBySymbol } from "@repo/shared/logic";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { ReportExportBar } from "@/components/reports/ReportExportBar";
import { useThemeColor } from "@/lib/colors";

export default function BestWorstPerformersReportScreen() {
  const { data: investments, isLoading, error } = useAllInvestmentLog();
  const primary = useThemeColor("primary");

  const holdings = useMemo(() => {
    const grouped = investments ? groupInvestmentsBySymbol(investments) : [];
    return [...grouped]
      .sort((a, b) => b.returnPct - a.returnPct)
      .map((h) => ({ symbol: h.symbol, returnPct: Number((h.returnPct * 100).toFixed(2)) }));
  }, [investments]);

  const maxAbs = Math.max(...holdings.map((h) => Math.abs(h.returnPct)), 1);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-3 p-4 pb-32">
        <PageHeader title="Best/Worst Performing Holdings" description="Holdings ranked by unrealised return %." />
        <ReportExportBar
          title="Best-Worst Performers"
          description="Holdings ranked by unrealised return %."
          sheets={[{ name: "Performance", rows: holdings.map((h) => ({ Symbol: h.symbol, "Return %": h.returnPct })) }]}
        />
        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : holdings.length === 0 ? (
          <AppText className="py-8 text-center text-sm text-muted-foreground">
            No holdings found. Add your first investment to get started.
          </AppText>
        ) : (
          holdings.map((h) => (
            <View key={h.symbol} className="gap-2 rounded-2xl bg-card px-4 py-3.5">
              <View className="flex-row items-center justify-between">
                <AppText className="text-sm font-medium">{h.symbol}</AppText>
                <AppText className={h.returnPct >= 0 ? "text-sm font-medium text-success" : "text-sm font-medium text-destructive"}>
                  {h.returnPct}%
                </AppText>
              </View>
              <View className="h-1.5 overflow-hidden rounded-full bg-muted">
                <View
                  className={h.returnPct >= 0 ? "h-full rounded-full bg-success" : "h-full rounded-full bg-destructive"}
                  style={{ width: `${(Math.abs(h.returnPct) / maxAbs) * 100}%` }}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
