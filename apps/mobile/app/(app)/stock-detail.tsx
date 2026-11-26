import { useMemo } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { TrendingUp, BarChart2, Layers } from "lucide-react-native";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { groupInvestmentsBySymbol } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Stock Detail Screen
 * Live quote & individual position analysis.
 */
export default function StockDetailScreen() {
  const { theme } = useTheme();
  const { symbol: symbolParam } = useLocalSearchParams<{ symbol: string }>();
  const symbol = (symbolParam ?? "").toUpperCase();

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
          title={symbol || "Stock Detail"}
          description="Live position metrics and P&L breakdown"
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        {holding ? (
          <View className="gap-4">
            {/* Position Summary Card */}
            <Card variant="elevated" className="p-5 gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <BarChart2 size={20} color={theme.primary} />
                  <AppText className="text-base font-semibold text-foreground">
                    Holding Metrics
                  </AppText>
                </View>
                <AppText className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container">
                  {holding.assetType}
                </AppText>
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View className="flex-row justify-between">
                  <View>
                    <AppText className="text-xs text-muted-foreground">Units Held</AppText>
                    <AppText className="text-xl font-bold text-foreground mt-0.5" style={{ fontVariant: ["tabular-nums"] }}>
                      {holding.unitsHeld}
                    </AppText>
                  </View>
                  <View className="items-end">
                    <AppText className="text-xs text-muted-foreground">Avg Buy Price</AppText>
                    <AppText className="text-xl font-bold text-foreground mt-0.5" style={{ fontVariant: ["tabular-nums"] }}>
                      {formatINR(holding.avgBuyPrice)}
                    </AppText>
                  </View>
                </View>

                <View className="flex-row justify-between pt-2 border-t border-border/50">
                  <View>
                    <AppText className="text-xs text-muted-foreground">Current Live Price</AppText>
                    <AppText className="text-xl font-bold text-foreground mt-0.5" style={{ fontVariant: ["tabular-nums"] }}>
                      {formatINR(holding.currentPrice)}
                    </AppText>
                  </View>
                  <View className="items-end">
                    <AppText className="text-xs text-muted-foreground">Total Valuation</AppText>
                    <AppText className="text-xl font-bold text-foreground mt-0.5" style={{ fontVariant: ["tabular-nums"] }}>
                      {formatINR(holding.currentValue)}
                    </AppText>
                  </View>
                </View>
              </View>

              {/* Unrealized P&L Banner */}
              <View className="pt-3 border-t border-border/60 flex-row items-center justify-between">
                <AppText className="text-sm font-medium text-muted-foreground">Unrealized P&L</AppText>
                <View className="flex-row items-center gap-2">
                  <AmountText
                    value={holding.unrealisedPnl}
                    sign={holding.unrealisedPnl >= 0 ? "positive" : "negative"}
                    className="text-lg font-bold"
                  />
                  <AppText
                    className={holding.unrealisedPnl >= 0 ? "text-sm text-success font-semibold" : "text-sm text-destructive font-semibold"}
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    ({holding.returnPct >= 0 ? "+" : ""}{(holding.returnPct * 100).toFixed(2)}%)
                  </AppText>
                </View>
              </View>
            </Card>
          </View>
        ) : (
          !isLoading && (
            <Card variant="outlined" className="p-6 items-center justify-center">
              <AppText className="text-sm text-muted-foreground">
                No active holdings found for {symbol}.
              </AppText>
            </Card>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
