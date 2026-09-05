import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Hash, Wallet, LineChart, TrendingUp } from "lucide-react-native";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { useEntitlements } from "@/hooks/useEntitlements";
import { groupInvestmentsBySymbol } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { KpiGrid, type KpiStatItem } from "@/components/dashboard/KpiGrid";
import { ProBlurredPreview } from "@/components/shared/ProGate";
import { FundamentalCard } from "@/components/investments/FundamentalCard";
import { useThemeColor } from "@/lib/colors";

/**
 * Mirrors apps/web/src/app/(app)/portfolio/[symbol]/page.tsx — a flat route with a
 * `?symbol=` param rather than a nested `portfolio/[symbol]` segment, since Expo Router
 * would otherwise need `portfolio.tsx` restructured into `portfolio/index.tsx` to coexist
 * with a dynamic child, and that risks the existing Tabs navigator's registration of
 * "portfolio" as a flat screen. A query param sidesteps that entirely for the same result.
 */
export default function StockDetailScreen() {
  const { symbol: symbolParam } = useLocalSearchParams<{ symbol: string }>();
  const symbol = (symbolParam ?? "").toUpperCase();
  const { hasFeature } = useEntitlements();
  const primary = useThemeColor("primary");

  const { data: allInvestments, isLoading, error } = useAllInvestmentLog();
  const { data: holdingRows } = useHoldings();

  const livePriceOverrides = useMemo(
    () => Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price])),
    [holdingRows]
  );
  const holding = useMemo(() => {
    if (!allInvestments) return null;
    const holdings = groupInvestmentsBySymbol(allInvestments, livePriceOverrides);
    return holdings.find((h) => h.symbol.toUpperCase() === symbol) ?? null;
  }, [allInvestments, livePriceOverrides, symbol]);

  const kpis: KpiStatItem[] = holding
    ? [
        { label: "Quantity", value: String(holding.unitsHeld), icon: Hash },
        { label: "Avg Cost", value: formatINR(holding.avgBuyPrice), icon: Wallet },
        { label: "Current Price", value: formatINR(holding.currentPrice), icon: LineChart, tone: "info" },
        {
          label: "P&L",
          value: formatINR(holding.unrealisedPnl),
          icon: TrendingUp,
          tone: holding.unrealisedPnl >= 0 ? "success" : "destructive",
        },
      ]
    : [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader title={symbol} description={holding ? holding.exchange : "Holding not found"} />

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : !holding ? (
          <AppText className="text-sm text-muted-foreground">
            No open position in {symbol}. It may have been fully sold, or the symbol doesn&apos;t match anything in
            your investment log.
          </AppText>
        ) : (
          <>
            <KpiGrid items={kpis} />

            <ProBlurredPreview
              feature="livePriceRefresh"
              title="Stock Fundamentals"
              description="P/E ratio, 52-week range, margins, market cap, and more."
              onUpgradePress={() => router.push("/(app)/billing")}
            >
              {hasFeature("livePriceRefresh") ? (
                <FundamentalCard ticker={symbol} />
              ) : (
                <View className="gap-4 rounded-2xl bg-card p-5">
                  <AppText className="text-sm font-semibold">Fundamentals</AppText>
                  <View className="flex-row flex-wrap gap-x-4 gap-y-3">
                    {["Trailing P/E", "Forward P/E", "52W High", "52W Low", "Profit Margin", "Market Cap", "Beta", "Dividend Yield"].map(
                      (label) => (
                        <View key={label} className="w-[47%] gap-0.5">
                          <AppText className="text-xs text-muted-foreground">{label}</AppText>
                          <AppText className="text-sm font-semibold">--</AppText>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}
            </ProBlurredPreview>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
