import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingUp } from "lucide-react-native";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { computePortfolioXirr } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useThemeColor } from "@/lib/colors";

export default function XirrReportScreen() {
  const { data: investments, isLoading: isLogsLoading, error: logsError } = useAllInvestmentLog();
  const { data: holdings, isLoading: isHoldingsLoading, error: holdingsError } = useHoldings();
  const primary = useThemeColor("primary");

  const report = useMemo(() => {
    const holdingsData = (holdings ?? []).map((h) => ({
      symbol: h.symbol,
      shares: h.shares,
      current_price: h.live_price ?? h.avg_buy_price,
      current_value: (h.shares ?? 0) * (h.live_price ?? h.avg_buy_price ?? 0),
    }));

    return computePortfolioXirr(investments ?? [], holdingsData);
  }, [investments, holdings]);

  const isLoading = isLogsLoading || isHoldingsLoading;
  const error = logsError || holdingsError;

  const sheets = [
    {
      name: "XIRR Analysis",
      rows: report.holdings.map((h) => ({
        Symbol: h.symbol,
        "Annualized XIRR %": h.xirrPct ?? "N/A",
        "Total Invested": h.totalInvested,
        "Current Value": h.currentValue,
        "Total Realized": h.totalRealized,
        "Total Dividends": h.totalDividends,
        "First Date": h.firstDate ?? "N/A",
      })),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader
          title="XIRR Return Analysis"
          description="Annualized internal rate of return across all cash flows."
        />

        {!isLoading && report.holdings.length > 0 && (
          <ReportExportBar
            title="XIRR Report"
            description={`Overall Portfolio XIRR: ${report.portfolioXirrPct != null ? `${report.portfolioXirrPct.toFixed(2)}%` : "N/A"}`}
            sheets={sheets}
          />
        )}

        {/* Portfolio XIRR Hero Banner */}
        <View className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
          <View className="flex-row items-center gap-2">
            <View className="size-8 items-center justify-center rounded-full bg-primary/10">
              <TrendingUp size={16} color={primary} />
            </View>
            <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Overall Portfolio XIRR
            </AppText>
          </View>
          <View className="mt-2 flex-row items-baseline gap-2">
            <AppText className="text-3xl font-extrabold text-foreground">
              {report.portfolioXirrPct !== null
                ? `${report.portfolioXirrPct >= 0 ? "+" : ""}${report.portfolioXirrPct.toFixed(2)}%`
                : "N/A"}
            </AppText>
            <AppText className="text-xs font-medium text-muted-foreground">per annum</AppText>
          </View>

          <View className="mt-4 flex-row gap-3 border-t border-border/50 pt-3">
            <View className="flex-1">
              <AppText className="text-[11px] text-muted-foreground">Total Invested</AppText>
              <AppText className="text-sm font-semibold">{formatINR(report.totalInvested)}</AppText>
            </View>
            <View className="flex-1">
              <AppText className="text-[11px] text-muted-foreground">Current Value</AppText>
              <AppText className="text-sm font-semibold">{formatINR(report.currentPortfolioValue)}</AppText>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : report.holdings.length === 0 ? (
          <AppText className="py-8 text-center text-sm text-muted-foreground">
            No investment cash flows recorded yet.
          </AppText>
        ) : (
          <View className="gap-3">
            <AppText className="text-xs font-semibold text-muted-foreground uppercase">
              Returns by Holding ({report.holdings.length})
            </AppText>
            {report.holdings.map((h) => {
              const hasXirr = h.xirrPct !== null;
              const isPositive = (h.xirrPct ?? 0) >= 0;

              return (
                <View key={h.symbol} className="gap-3 rounded-2xl bg-card p-4">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <AppText className="font-semibold">{h.symbol}</AppText>
                      {h.firstDate && (
                        <AppText className="text-[11px] text-muted-foreground">Since {h.firstDate}</AppText>
                      )}
                    </View>
                    {hasXirr ? (
                      <StatusBadge tone={isPositive ? "success" : "destructive"}>
                        {isPositive ? "+" : ""}{h.xirrPct!.toFixed(2)}% p.a.
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="default">—</StatusBadge>
                    )}
                  </View>

                  <View className="flex-row justify-between border-t border-border/50 pt-2.5">
                    <View>
                      <AppText className="text-xs text-muted-foreground">Invested</AppText>
                      <AppText className="text-xs font-medium">{formatINR(h.totalInvested)}</AppText>
                    </View>
                    <View>
                      <AppText className="text-xs text-muted-foreground">Current</AppText>
                      <AppText className="text-xs font-medium">{formatINR(h.currentValue)}</AppText>
                    </View>
                    <View className="items-end">
                      <AppText className="text-xs text-muted-foreground">Sold + Dividends</AppText>
                      <AppText className="text-xs font-medium">{formatINR(h.totalRealized + h.totalDividends)}</AppText>
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
