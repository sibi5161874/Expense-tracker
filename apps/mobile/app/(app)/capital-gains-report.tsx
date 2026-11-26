import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileSpreadsheet, TrendingUp, Receipt } from "lucide-react-native";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { computeCapitalGains } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { StatusBadge } from "@/components/common/Badge";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Capital Gains Report Screen
 */
export default function CapitalGainsReportScreen() {
  const { theme } = useTheme();
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

  const sheets = useMemo(
    () => [
      {
        name: "Capital Gains Summary",
        headers: ["Metric", "Amount (INR)"],
        rows: [
          { Metric: "Financial Year", "Amount (INR)": activeSummary.financialYear },
          { Metric: "Total Sell Proceeds", "Amount (INR)": activeSummary.totalSellProceeds },
          { Metric: "Total Cost Basis", "Amount (INR)": activeSummary.totalCostBasis },
          { Metric: "Net STCG", "Amount (INR)": activeSummary.netStcg },
          { Metric: "Net LTCG", "Amount (INR)": activeSummary.netLtcg },
          { Metric: "Total Net Capital Gains", "Amount (INR)": activeSummary.totalNetGains },
        ],
      },
      {
        name: "Matched Trades",
        headers: ["Symbol", "Tax Type", "Buy Date", "Sell Date", "Qty", "Cost", "Proceeds", "Gain/Loss"],
        rows: filteredTrades.map((t) => ({
          Symbol: t.symbol,
          "Tax Type": t.taxType,
          "Buy Date": t.buyDate,
          "Sell Date": t.sellDate,
          Qty: t.quantity,
          Cost: t.buyCost,
          Proceeds: t.sellProceeds,
          "Gain/Loss": t.gain,
        })),
      },
    ],
    [activeSummary, filteredTrades]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader showBack />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Capital Gains (STCG/LTCG)"
          description="FIFO realized gains & tax classification"
        />

        <ReportExportBar
          title={`Capital Gains Report - ${activeSummary.financialYear}`}
          description="ITR-ready realized capital gains summary"
          sheets={sheets}
        />

        {/* FY Selector Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 py-1">
            <Pressable
              onPress={() => setSelectedFY("all")}
              className={`px-4 py-2 rounded-full border transition-colors ${
                selectedFY === "all"
                  ? "bg-primary border-primary"
                  : "bg-surface-container-highest border-outline-variant/60"
              }`}
            >
              <AppText
                className={`text-xs font-semibold ${
                  selectedFY === "all" ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                All Years
              </AppText>
            </Pressable>
            {report.availableFYs.map((fy) => (
              <Pressable
                key={fy}
                onPress={() => setSelectedFY(fy)}
                className={`px-4 py-2 rounded-full border transition-colors ${
                  selectedFY === fy
                    ? "bg-primary border-primary"
                    : "bg-surface-container-highest border-outline-variant/60"
                }`}
              >
                <AppText
                  className={`text-xs font-semibold ${
                    selectedFY === fy ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {fy}
                </AppText>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        {/* Summary KPIs */}
        <Card variant="elevated" className="p-5 gap-3.5">
          <View className="flex-row items-center justify-between">
            <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              FY: {activeSummary.financialYear}
            </AppText>
            <StatusBadge tone={activeSummary.totalNetGains >= 0 ? "success" : "destructive"}>
              {activeSummary.totalNetGains >= 0 ? "GAIN" : "LOSS"}
            </StatusBadge>
          </View>

          <View className="flex-row items-center justify-between pt-1">
            <AppText className="text-sm font-semibold text-foreground">Total Realized P&L</AppText>
            <AmountText
              value={activeSummary.totalNetGains}
              sign={activeSummary.totalNetGains >= 0 ? "positive" : "negative"}
              className="text-xl font-bold"
            />
          </View>

          <View className="pt-2 border-t border-border/50 gap-2">
            <View className="flex-row items-center justify-between">
              <AppText className="text-xs text-muted-foreground">Short Term Capital Gains (STCG)</AppText>
              <AmountText value={activeSummary.netStcg} className="text-sm font-semibold" />
            </View>
            <View className="flex-row items-center justify-between">
              <AppText className="text-xs text-muted-foreground">Long Term Capital Gains (LTCG)</AppText>
              <AmountText value={activeSummary.netLtcg} className="text-sm font-semibold" />
            </View>
            <View className="flex-row items-center justify-between">
              <AppText className="text-xs text-muted-foreground">Total Cost Basis</AppText>
              <AppText className="text-sm font-semibold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                {formatINR(activeSummary.totalCostBasis)}
              </AppText>
            </View>
          </View>
        </Card>

        {/* Matched Trades List */}
        <View className="gap-2.5">
          <AppText className="text-sm font-bold text-foreground">
            Matched Trades ({filteredTrades.length})
          </AppText>

          {filteredTrades.map((t, idx) => (
            <Card key={`${t.symbol}-${t.sellDate}-${idx}`} variant="outlined" className="p-4 gap-1.5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <AppText className="text-sm font-bold text-foreground">{t.symbol}</AppText>
                  <AppText className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                    {t.taxType}
                  </AppText>
                </View>
                <AmountText
                  value={t.gain}
                  sign={t.gain >= 0 ? "positive" : "negative"}
                  className="text-sm font-bold"
                />
              </View>
              <AppText className="text-xs text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                Buy: {t.buyDate} • Sell: {t.sellDate} • Held: {t.holdingDays}d • Qty: {t.quantity}
              </AppText>
            </Card>
          ))}

          {!isLoading && filteredTrades.length === 0 && (
            <Card variant="outlined" className="p-6 items-center justify-center">
              <AppText className="text-sm text-muted-foreground">
                No realized trades found for this selection.
              </AppText>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
