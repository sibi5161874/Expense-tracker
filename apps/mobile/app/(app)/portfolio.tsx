import { useState, useMemo } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RefreshCw, Plus, TrendingUp, TrendingDown } from "lucide-react-native";
import { useAllInvestmentLog, useInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { useAccounts } from "@/hooks/useAccounts";
import { useRefreshPrices } from "@/hooks/useRefreshPrices";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { groupInvestmentsBySymbol, summarizeHoldings } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils";

import { AppText } from "@/components/common/AppText";
import { Card } from "@/components/common/Card";
import { AmountText } from "@/components/common/AmountText";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { Fab } from "@/components/common/Fab";
import { MarketHeatmap } from "@/components/portfolio/MarketHeatmap";
import { TaxLossHarvestingCard } from "@/components/investments/TaxLossHarvestingCard";
import { AddInvestmentSheet } from "@/components/investments/AddInvestmentSheet";
import { AppHeader } from "@/components/common/AppHeader";
import { PortfolioBenchmarkChart } from "@/components/dashboard/PortfolioBenchmarkChart";
import { PassiveIncomeWidget } from "@/components/dashboard/PassiveIncomeWidget";
import { DonutChart } from "@/components/charts/DonutChart";
import { useTheme } from "@/theme/ThemeProvider";

export default function PortfolioScreen() {
  const { theme } = useTheme();
  const isOnline = useNetworkStatus();
  const [activeTab, setActiveTab] = useState<"holdings" | "heatmap" | "tax">("holdings");
  const [showAddSheet, setShowAddSheet] = useState(false);

  const { data: accounts } = useAccounts(true);
  const { data: allInvestments, isLoading, error } = useAllInvestmentLog();
  const { createInvestmentLog } = useInvestmentLog();
  const { data: holdingRows } = useHoldings();
  const { refresh, isRefreshing } = useRefreshPrices();

  const livePriceOverrides = useMemo(
    () => Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price])),
    [holdingRows]
  );

  const holdings = useMemo(
    () => (allInvestments ? groupInvestmentsBySymbol(allInvestments, livePriceOverrides) : []),
    [allInvestments, livePriceOverrides]
  );

  const summary = useMemo(() => summarizeHoldings(holdings), [holdings]);
  const isPositive = summary.totalPnl >= 0;

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader title="Portfolio" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 96,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View>
            <AppText className="text-2xl font-bold tracking-tight text-foreground">
              Portfolio
            </AppText>
            <AppText className="text-xs text-muted-foreground">
              {holdings.length} tracked assets
            </AppText>
          </View>

          {/* Refresh Action */}
          <Pressable
            disabled={isRefreshing}
            onPress={() => {
              if (!isOnline) {
                Alert.alert(
                  "Offline Mode",
                  "Live prices cannot be refreshed without an active internet connection. Showing your cached portfolio values.",
                  [{ text: "OK" }]
                );
                return;
              }
              refresh();
            }}
            className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.card,
              opacity: isOnline ? 1 : 0.7,
            }}
          >
            <RefreshCw
              size={14}
              color={theme.primary}
              className={isRefreshing ? "animate-spin" : ""}
            />
            <AppText className="text-xs font-semibold text-primary">
              {isRefreshing ? "Updating..." : isOnline ? "Refresh" : "Offline"}
            </AppText>
          </Pressable>
        </View>

        {isLoading && (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}

        {error && (
          <View
            className="rounded-2xl border p-4"
            style={{
              backgroundColor: theme.destructiveSubtle || "#fee2e2",
              borderColor: theme.destructive,
            }}
          >
            <AppText className="text-xs text-destructive">{error.message}</AppText>
          </View>
        )}

        {/* Valuation Hero Card */}
        <Card variant="elevated" className="gap-3">
          <View className="flex-row items-center justify-between">
            <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Portfolio Value
            </AppText>
            <View
              className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
              style={{
                backgroundColor: isPositive
                  ? theme.successSubtle || "#dcfce7"
                  : theme.destructiveSubtle || "#fee2e2",
              }}
            >
              {isPositive ? (
                <TrendingUp size={12} color={theme.success} />
              ) : (
                <TrendingDown size={12} color={theme.destructive} />
              )}
              <AppText
                className="text-xs font-semibold"
                style={{ color: isPositive ? theme.success : theme.destructive }}
              >
                {isPositive ? "+" : ""}
                {summary.pnlPercentage.toFixed(2)}%
              </AppText>
            </View>
          </View>

          <AppText
            className="text-3xl font-extrabold tracking-tight text-foreground"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatINR(summary.currentValue)}
          </AppText>

          <View
            className="flex-row items-center justify-between border-t pt-3"
            style={{
              borderTopColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
            }}
          >
            <View>
              <AppText className="text-xs text-muted-foreground">Invested Capital</AppText>
              <AppText
                className="text-sm font-semibold text-foreground mt-0.5"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatINR(summary.totalInvested)}
              </AppText>
            </View>
            <View className="items-end">
              <AppText className="text-xs text-muted-foreground">Total Returns</AppText>
              <AmountText
                value={summary.totalPnl}
                colorBySign={true}
                className="text-sm font-semibold mt-0.5"
              />
            </View>
          </View>
        </Card>

        {/* Portfolio Benchmark Comparison */}
        <PortfolioBenchmarkChart />

        {/* M3 Segmented Navigation Tabs */}
        <SegmentedControl
          options={[
            { value: "holdings", label: "Holdings" },
            { value: "heatmap", label: "Heatmap" },
            { value: "tax", label: "Tax Harvest" },
          ]}
          value={activeTab}
          onChange={(val) => setActiveTab(val as "holdings" | "heatmap" | "tax")}
        />

        {/* Tab 1: Holdings List */}
        {activeTab === "holdings" && (
          <View className="gap-3">
            {holdings.length > 0 && (
              <>
                <Card variant="outlined" className="gap-3">
                  <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Asset Allocation
                  </AppText>
                  <DonutChart
                    data={holdings.map((h) => ({ name: h.symbol, value: h.currentValue }))}
                    size={180}
                    centerSubtitle="Portfolio"
                  />
                </Card>
                <PassiveIncomeWidget holdings={holdings} />
              </>
            )}
            {holdings.length === 0 ? (
              <View className="items-center justify-center p-8 gap-2">
                <AppText className="text-sm font-medium text-muted-foreground">
                  No investments logged yet
                </AppText>
                <AppText className="text-xs text-muted-foreground">
                  Tap '+' below to add your stocks or mutual funds.
                </AppText>
              </View>
            ) : (
              holdings.map((h) => {
                const holdingPositive = (h.unrealisedPnl ?? 0) >= 0;
                return (
                  <Card
                    key={h.symbol}
                    variant="outlined"
                    className="flex-row items-center justify-between py-3"
                  >
                    <View className="gap-0.5">
                      <AppText className="text-sm font-bold text-foreground">
                        {h.symbol}
                      </AppText>
                      <AppText className="text-xs text-muted-foreground">
                        {h.unitsHeld} units • Avg {formatINR(h.avgBuyPrice)}
                      </AppText>
                    </View>

                    <View className="items-end gap-0.5">
                      <AppText
                        className="text-sm font-bold text-foreground"
                        style={{ fontVariant: ["tabular-nums"] }}
                      >
                        {formatINR(h.currentValue)}
                      </AppText>
                      <View className="flex-row items-center gap-1">
                        <AmountText
                          value={h.unrealisedPnl}
                          colorBySign={true}
                          className="text-xs font-medium"
                        />
                        <AppText
                          className="text-xs font-medium"
                          style={{
                            color: holdingPositive ? theme.success : theme.destructive,
                          }}
                        >
                          ({holdingPositive ? "+" : ""}
                          {(h.returnPct * 100).toFixed(1)}%)
                        </AppText>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* Tab 2: Market Heatmap */}
        {activeTab === "heatmap" && <MarketHeatmap />}

        {/* Tab 3: Tax Loss Harvesting */}
        {activeTab === "tax" && <TaxLossHarvestingCard holdings={holdings} />}
      </ScrollView>

      {/* Floating Add Investment FAB */}
      <View className="absolute bottom-6 right-5">
        <Fab
          icon={<Plus size={24} color={theme.onPrimary} />}
          onPress={() => setShowAddSheet(true)}
        />
      </View>

      {/* Add Investment Sheet */}
      <AddInvestmentSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        accounts={accounts ?? []}
        onSubmit={(data) => createInvestmentLog(data)}
      />
    </SafeAreaView>
  );
}
