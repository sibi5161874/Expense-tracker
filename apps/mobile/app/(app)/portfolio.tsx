import { useMemo, useState } from "react";
import { ScrollView, View, ActivityIndicator, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { RefreshCw, Lock, AlertTriangle, Wallet, LineChart, TrendingUp, Percent } from "lucide-react-native";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { useRefreshPrices } from "@/hooks/useRefreshPrices";
import { useEntitlements } from "@/hooks/useEntitlements";
import { checkIsOnline } from "@/hooks/useNetworkStatus";
import { formatRelativeTime } from "@repo/shared/utils";
import { groupInvestmentsBySymbol, summarizeHoldings, filterAndSortHoldings } from "@repo/shared/logic";
import type { FilterType, SortKey } from "@repo/shared/types";
import { AppText } from "@/components/common/AppText";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiGrid, type KpiStatItem } from "@/components/dashboard/KpiGrid";
import { CategoryBarList } from "@/components/dashboard/CategoryBarList";
import { HoldingsList } from "@/components/investments/HoldingsList";
import { TaxLossHarvestingCard } from "@/components/investments/TaxLossHarvestingCard";
import { LossMakingHoldingsCard } from "@/components/portfolio/LossMakingHoldingsCard";
import { AssetClassBreakdownCard } from "@/components/portfolio/AssetClassBreakdownCard";
import { AssetClassTabs } from "@/components/portfolio/AssetClassTabs";
import { HoldingsFilterBar } from "@/components/portfolio/HoldingsFilterBar";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useThemeColor } from "@/lib/colors";

export default function PortfolioScreen() {
  const { data: allInvestments, isLoading, error } = useAllInvestmentLog();
  const { data: holdingRows } = useHoldings();
  const { refresh, isRefreshing } = useRefreshPrices();
  const { hasFeature } = useEntitlements();
  const primary = useThemeColor("primary");
  const warning = useThemeColor("warning");
  const mutedForeground = useThemeColor("mutedForeground");

  // Filter & sort state
  const [selectedAssetTab, setSelectedAssetTab] = useState("All");
  const [sortValue, setSortValue] = useState<SortKey>("currentValue_desc");
  const [filterValue, setFilterValue] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const livePriceOverrides = useMemo(
    () => Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price])),
    [holdingRows]
  );
  const lastUpdated = useMemo(() => {
    if (!holdingRows || holdingRows.length === 0) return null;
    return holdingRows.reduce((latest, h) => (h.updated_at > latest ? h.updated_at : latest), holdingRows[0]!.updated_at);
  }, [holdingRows]);

  const isStale = useMemo(() => {
    if (!lastUpdated) return false;
    return Date.now() - new Date(lastUpdated).getTime() > 24 * 60 * 60 * 1000;
  }, [lastUpdated]);

  const holdings = useMemo(
    () => (allInvestments ? groupInvestmentsBySymbol(allInvestments, livePriceOverrides) : []),
    [allInvestments, livePriceOverrides]
  );

  const filteredHoldings = useMemo(() => {
    return filterAndSortHoldings(holdings, {
      assetType: selectedAssetTab,
      filter: filterValue,
      sortBy: sortValue,
      searchQuery,
    });
  }, [holdings, selectedAssetTab, filterValue, sortValue, searchQuery]);

  const allocation = useMemo(() => holdings.map((h) => ({ name: h.symbol, value: h.currentValue })), [holdings]);
  const summary = allInvestments ? summarizeHoldings(holdings) : null;

  async function handleRefresh() {
    if (!hasFeature("livePriceRefresh")) {
      Alert.alert("Pro feature", "Live price refresh is a Pro feature.", [
        { text: "Not now", style: "cancel" },
        { text: "View plans", onPress: () => router.push("/(app)/billing") },
      ]);
      return;
    }
    if (!(await checkIsOnline())) {
      Alert.alert("You're offline", "Connect to the internet to refresh live prices. Your holdings still show the last prices we fetched.");
      return;
    }
    try {
      const result = await refresh();
      if (result.updated.length > 0 && result.failed.length === 0) {
        Alert.alert("Prices updated", `Updated ${result.updated.length} price${result.updated.length === 1 ? "" : "s"}.`);
      } else if (result.failed.length > 0) {
        const reason = result.failedReasons?.[result.failed[0]!];
        Alert.alert("Refresh issue", reason ?? `Couldn't refresh: ${result.failed.join(", ")}`);
      } else {
        Alert.alert("Nothing to refresh", result.message ?? "No Stock/ETF holdings to refresh.");
      }
    } catch (e) {
      Alert.alert("Refresh failed", e instanceof Error ? e.message : "Failed to refresh prices.");
    }
  }

  const kpis: KpiStatItem[] = summary
    ? [
        { label: "Total Invested", value: summary.totalInvested, icon: Wallet },
        { label: "Current Value", value: summary.currentValue, icon: LineChart, tone: "info" },
        { label: "Total P&L", value: summary.totalPnl, icon: TrendingUp, tone: summary.totalPnl >= 0 ? "success" : "destructive" },
        {
          label: "P&L %",
          value: `${summary.pnlPercentage.toFixed(2)}%`,
          icon: Percent,
          tone: summary.pnlPercentage >= 0 ? "success" : "destructive",
        },
      ]
    : [];

  const sheets = [
    {
      name: "Portfolio Summary",
      rows: holdings.map((h) => ({
        Symbol: h.symbol,
        Exchange: h.exchange,
        Units: h.unitsHeld,
        "Avg Cost": h.avgBuyPrice,
        "Current Price": h.currentPrice,
        Invested: h.invested,
        "Current Value": h.currentValue,
        "P&L": h.unrealisedPnl,
        "Return %": Number((h.returnPct * 100).toFixed(2)),
      })),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 p-4 pb-32">
        <PageHeader
          title="Portfolio"
          description="Holdings computed from your investment log."
          action={
            <Pressable
              onPress={handleRefresh}
              disabled={isRefreshing}
              className="size-9 items-center justify-center rounded-full bg-muted"
            >
              {hasFeature("livePriceRefresh") ? (
                <RefreshCw size={16} color={primary} />
              ) : (
                <Lock size={16} color={primary} />
              )}
            </Pressable>
          }
        />

        {lastUpdated && (
          <View className="-mt-4 flex-row items-center gap-1.5">
            {isStale && <AlertTriangle size={13} color={warning} />}
            <AppText className="text-xs" style={{ color: isStale ? warning : mutedForeground }}>
              {isStale ? "Prices may be stale — " : "Last updated "}
              {formatRelativeTime(lastUpdated)}
            </AppText>
          </View>
        )}

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : (
          <>
            {/* Loss-Making Holdings Section */}
            <LossMakingHoldingsCard holdings={holdings} />

            {/* Asset Class Breakdown Section */}
            <AssetClassBreakdownCard holdings={holdings} />

            {summary && <KpiGrid items={kpis} />}

            {holdings.length > 0 && (
              <ReportExportBar title="Portfolio Summary" description="Current value, invested amount, and P&L per holding." sheets={sheets} />
            )}

            {holdings.length > 0 && <TaxLossHarvestingCard holdings={holdings} />}

            {allocation.length > 0 && (
              <View className="gap-3 rounded-2xl bg-card p-4">
                <AppText className="text-sm font-semibold">Allocation by symbol</AppText>
                <CategoryBarList data={allocation} />
              </View>
            )}

            <View className="gap-3">
              <AssetClassTabs
                holdings={holdings}
                selectedTab={selectedAssetTab}
                onSelectTab={setSelectedAssetTab}
              />

              <HoldingsFilterBar
                sortValue={sortValue}
                onSortChange={setSortValue}
                filterValue={filterValue}
                onFilterChange={setFilterValue}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />

              <View className="flex-row items-center justify-between pt-1">
                <AppText className="text-sm font-semibold">
                  Holdings ({filteredHoldings.length})
                </AppText>
              </View>

              <HoldingsList holdings={filteredHoldings} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
