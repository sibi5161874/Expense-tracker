import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { computeCapitalGains } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useThemeColor } from "@/lib/colors";

export default function CapitalGainsReportScreen() {
  const { data: investments, isLoading, error } = useAllInvestmentLog();
  const [selectedFY, setSelectedFY] = useState<string>("all");
  const primary = useThemeColor("primary");

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

  const sheets = [
    {
      name: "Capital Gains",
      rows: filteredTrades.map((t) => ({
        Symbol: t.symbol,
        "Asset Type": t.assetType,
        "Buy Date": t.buyDate,
        "Sell Date": t.sellDate,
        "Holding Days": t.holdingDays,
        Category: t.taxType,
        Quantity: t.quantity,
        "Buy Cost": t.buyCost,
        "Sell Proceeds": t.sellProceeds,
        "Realized Gain": t.gain,
        "Gain %": t.gainPct,
        "Financial Year": t.financialYear,
      })),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader
          title="Capital Gains (STCG/LTCG)"
          description="FIFO realized gains & Indian tax season classification."
        />

        {!isLoading && filteredTrades.length > 0 && (
          <ReportExportBar
            title="Capital Gains Report"
            description={`Realized P&L: ${formatINR(activeSummary.totalNetGains)} (${selectedFY === "all" ? "All Years" : selectedFY})`}
            sheets={sheets}
          />
        )}

        {/* FY Selector Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setSelectedFY("all")}
              className={`rounded-full px-4 py-1.5 ${selectedFY === "all" ? "bg-primary" : "bg-card border border-border"}`}
            >
              <AppText className={`text-xs font-semibold ${selectedFY === "all" ? "text-primary-foreground" : "text-muted-foreground"}`}>
                All Years
              </AppText>
            </Pressable>
            {report.availableFYs.map((fy) => (
              <Pressable
                key={fy}
                onPress={() => setSelectedFY(fy)}
                className={`rounded-full px-4 py-1.5 ${selectedFY === fy ? "bg-primary" : "bg-card border border-border"}`}
              >
                <AppText className={`text-xs font-semibold ${selectedFY === fy ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  {fy}
                </AppText>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Summary Metric Cards */}
        <View className="grid grid-cols-2 gap-3">
          <View className="rounded-2xl bg-card p-4">
            <AppText className="text-xs text-muted-foreground">Total Realized P&L</AppText>
            <AppText className={`mt-1 text-lg font-bold ${activeSummary.totalNetGains >= 0 ? "text-success" : "text-destructive"}`}>
              {activeSummary.totalNetGains >= 0 ? "+" : ""}{formatINR(activeSummary.totalNetGains)}
            </AppText>
            <AppText className="mt-0.5 text-[11px] text-muted-foreground">
              Sales: {formatINR(activeSummary.totalSellProceeds)}
            </AppText>
          </View>

          <View className="rounded-2xl bg-card p-4">
            <AppText className="text-xs text-muted-foreground">Short Term (STCG)</AppText>
            <AppText className={`mt-1 text-lg font-bold ${activeSummary.netStcg >= 0 ? "text-success" : "text-destructive"}`}>
              {activeSummary.netStcg >= 0 ? "+" : ""}{formatINR(activeSummary.netStcg)}
            </AppText>
            <AppText className="mt-0.5 text-[11px] text-muted-foreground">
              Gains: {formatINR(activeSummary.stcgGains)}
            </AppText>
          </View>

          <View className="rounded-2xl bg-card p-4">
            <AppText className="text-xs text-muted-foreground">Long Term (LTCG)</AppText>
            <AppText className={`mt-1 text-lg font-bold ${activeSummary.netLtcg >= 0 ? "text-success" : "text-destructive"}`}>
              {activeSummary.netLtcg >= 0 ? "+" : ""}{formatINR(activeSummary.netLtcg)}
            </AppText>
            <AppText className="mt-0.5 text-[11px] text-muted-foreground">
              Gains: {formatINR(activeSummary.ltcgGains)}
            </AppText>
          </View>

          <View className="rounded-2xl bg-card p-4">
            <AppText className="text-xs text-muted-foreground">Cost Basis</AppText>
            <AppText className="mt-1 text-lg font-bold">
              {formatINR(activeSummary.totalCostBasis)}
            </AppText>
            <AppText className="mt-0.5 text-[11px] text-muted-foreground">
              {filteredTrades.length} trade{filteredTrades.length === 1 ? "" : "s"}
            </AppText>
          </View>
        </View>

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : filteredTrades.length === 0 ? (
          <AppText className="py-8 text-center text-sm text-muted-foreground">
            No realized trades found in this financial year.
          </AppText>
        ) : (
          <View className="gap-3">
            <AppText className="text-xs font-semibold text-muted-foreground uppercase">
              Matched Trades ({filteredTrades.length})
            </AppText>
            {filteredTrades.map((t, idx) => {
              const isPositive = t.gain >= 0;
              return (
                <View key={`${t.symbol}-${t.sellDate}-${idx}`} className="gap-3 rounded-2xl bg-card p-4">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <AppText className="font-semibold">{t.symbol}</AppText>
                      <AppText className="text-xs text-muted-foreground">{t.assetType}</AppText>
                    </View>
                    <StatusBadge tone={t.taxType === "LTCG" ? "default" : "info"}>
                      {t.taxType} ({t.holdingDays}d)
                    </StatusBadge>
                  </View>

                  <View className="flex-row justify-between text-xs">
                    <View>
                      <AppText className="text-xs text-muted-foreground">Buy Date</AppText>
                      <AppText className="text-xs font-medium">{t.buyDate}</AppText>
                    </View>
                    <View>
                      <AppText className="text-xs text-muted-foreground">Sell Date</AppText>
                      <AppText className="text-xs font-medium">{t.sellDate}</AppText>
                    </View>
                    <View className="items-end">
                      <AppText className="text-xs text-muted-foreground">Qty Sold</AppText>
                      <AppText className="text-xs font-medium">{t.quantity}</AppText>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between border-t border-border/50 pt-2.5">
                    <View>
                      <AppText className="text-xs text-muted-foreground">
                        Cost: {formatINR(t.buyCost)} → Proceeds: {formatINR(t.sellProceeds)}
                      </AppText>
                    </View>
                    <View className="items-end">
                      <AppText className={`text-sm font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                        {isPositive ? "+" : ""}{formatINR(t.gain)}
                      </AppText>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
