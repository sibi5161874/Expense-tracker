import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingUp, BarChart2 } from "lucide-react-native";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { computePortfolioXirr, groupInvestmentsBySymbol } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 XIRR Report Screen
 */
export default function XirrReportScreen() {
  const { theme } = useTheme();
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

  const sheets = useMemo(
    () => [
      {
        name: "Portfolio XIRR",
        headers: ["Symbol", "Total Invested", "Current Value", "XIRR (%)"],
        rows: [
          {
            Symbol: "Portfolio Overall",
            "Total Invested": report.totalInvested,
            "Current Value": report.currentPortfolioValue,
            "XIRR (%)": report.portfolioXirrPct !== null ? `${report.portfolioXirrPct.toFixed(2)}%` : "N/A",
          },
          ...report.holdings.map((h) => ({
            Symbol: h.symbol,
            "Total Invested": h.totalInvested,
            "Current Value": h.currentValue,
            "XIRR (%)": h.xirrPct !== null ? `${h.xirrPct.toFixed(2)}%` : "N/A",
          })),
        ],
      },
    ],
    [report]
  );

  const isLoading = isLogsLoading || isHoldingsLoading;
  const error = logsError || holdingsError;

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
          title="XIRR Return Analysis"
          description="Annualized internal rate of return across all cash flows"
        />

        <ReportExportBar
          title="Portfolio XIRR Analysis"
          description="True annualized returns calculated with exact transaction dates"
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        {/* Portfolio XIRR Banner */}
        <Card variant="elevated" className="p-5 gap-3">
          <View className="flex-row items-center gap-2">
            <TrendingUp size={22} color={theme.primary} />
            <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Overall Portfolio XIRR
            </AppText>
          </View>

          <AppText
            className={`text-3xl font-bold ${
              report.portfolioXirrPct !== null && report.portfolioXirrPct >= 0
                ? "text-success"
                : "text-destructive"
            }`}
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {report.portfolioXirrPct !== null
              ? `${report.portfolioXirrPct >= 0 ? "+" : ""}${report.portfolioXirrPct.toFixed(2)}% p.a.`
              : "N/A"}
          </AppText>

          <View className="pt-3 border-t border-border/60 flex-row justify-between">
            <View>
              <AppText className="text-xs text-muted-foreground">Total Invested</AppText>
              <AppText className="text-base font-semibold text-foreground mt-0.5" style={{ fontVariant: ["tabular-nums"] }}>
                {formatINR(report.totalInvested)}
              </AppText>
            </View>
            <View className="items-end">
              <AppText className="text-xs text-muted-foreground">Current Value</AppText>
              <AppText className="text-base font-semibold text-foreground mt-0.5" style={{ fontVariant: ["tabular-nums"] }}>
                {formatINR(report.currentPortfolioValue)}
              </AppText>
            </View>
          </View>
        </Card>

        {/* Holdings XIRR Breakdown */}
        <View className="gap-2.5">
          <AppText className="text-sm font-bold text-foreground">
            Holdings XIRR ({report.holdings.length})
          </AppText>

          {report.holdings.map((h) => (
            <Card key={h.symbol} variant="outlined" className="p-4 gap-2">
              <View className="flex-row items-center justify-between">
                <AppText className="text-sm font-bold text-foreground">{h.symbol}</AppText>
                <AppText
                  className={`text-sm font-bold ${
                    h.xirrPct != null && h.xirrPct >= 0 ? "text-success" : "text-destructive"
                  }`}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {h.xirrPct != null ? `${h.xirrPct >= 0 ? "+" : ""}${h.xirrPct.toFixed(2)}% p.a.` : "N/A"}
                </AppText>
              </View>
              <View className="flex-row justify-between text-xs">
                <AppText className="text-xs text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                  Invested: {formatINR(h.totalInvested)}
                </AppText>
                <AppText className="text-xs text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                  Current: {formatINR(h.currentValue)}
                </AppText>
              </View>
            </Card>
          ))}

          {!isLoading && report.holdings.length === 0 && (
            <Card variant="outlined" className="p-6 items-center justify-center">
              <AppText className="text-sm text-muted-foreground">No active holdings to compute XIRR.</AppText>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
