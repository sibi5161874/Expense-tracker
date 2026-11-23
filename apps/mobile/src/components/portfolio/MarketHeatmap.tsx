import { useState, useMemo } from 'react';
import { View, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react-native';
import { AppText } from '@/components/common/AppText';
import { useMarketHeatmap, type MarketHeatmapItem } from '@/hooks/useMarketHeatmap';
import { useThemeColor } from '@/lib/colors';
import { cn } from '@/lib/cn';

function getTradingViewColor(change: number): string {
  if (change >= 3) return '#00b050';
  if (change >= 1.5) return '#168a48';
  if (change >= 0) return '#154228';
  if (change >= -1.5) return '#4a181d';
  if (change >= -3) return '#a82329';
  return '#c51f26';
}

const BRAND_INITIALS: Record<string, string> = {
  RELIANCE: 'RIL',
  TCS: 'TCS',
  HDFCBANK: 'HDFC',
  ICICIBANK: 'ICICI',
  BHARTIARTL: 'AT',
  INFY: 'INFY',
  SBIN: 'SBI',
  ITC: 'ITC',
  HINDUNILVR: 'HUL',
  LT: 'L&T',
  BAJFINANCE: 'BF',
  HCLTECH: 'HCL',
  MARUTI: 'MS',
  SUNPHARMA: 'SUN',
  TATASTEEL: 'TS',
  KOTAKBANK: 'KM',
  AXISBANK: 'AXIS',
  TITAN: 'TTN',
  ONGC: 'ONGC',
  NTPC: 'NTPC',
  INDUSINDBK: 'INDB',
  POWERGRID: 'PG',
  ADANIENT: 'AE',
  ADANIPORTS: 'AP',
  COALINDIA: 'CIL',
  BAJAJFINSV: 'BFS',
  ULTRACEMCO: 'UTC',
  ASIANPAINT: 'AP',
  'M&M': 'M&M',
  JSWSTEEL: 'JSW',
  TRENT: 'TR',
  BEL: 'BEL',
  GRASIM: 'GR',
  HINDALCO: 'HAL',
  CIPLA: 'CP',
  DRREDDY: 'DRL',
  APOLLOHOSP: 'APO',
  EICHERMOT: 'EM',
  DIVISLAB: 'DIV',
  BPCL: 'BPCL',
  NESTLEIND: 'NES',
  BRITANNIA: 'BRIT',
  TATACONSUM: 'TC',
  HEROMOTOCO: 'HM',
  WIPRO: 'WIP',
  TECHM: 'TM',
  SBILIFE: 'SBL',
  HDFCLIFE: 'HDL',
  SHRIRAMFIN: 'SF',
  'BAJAJ-AUTO': 'BA',
};

const SECTOR_DISPLAY_MAP: Record<string, string> = {
  Finance: 'Finance',
  IT: 'Technology services',
  Energy: 'Energy minerals',
  Auto: 'Consumer durables',
  FMCG: 'Consumer non-durables',
  Materials: 'Non-energy materials',
  Health: 'Health technology',
  Consumer: 'Retail trade',
  Industrial: 'Producer manufacturing',
  Utilities: 'Utilities',
  Comm: 'Communications',
};

export function MarketHeatmap() {
  const { data, isLoading, error, refetch, isRefetching } = useMarketHeatmap();
  const [selectedSector, setSelectedSector] = useState<string>('All');

  const primary = useThemeColor('primary');
  const successColor = useThemeColor('success');
  const destructiveColor = useThemeColor('destructive');
  const mutedForeground = useThemeColor('mutedForeground');

  const items = useMemo(() => data?.data ?? [], [data]);

  const sectors = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.sector) set.add(item.sector);
    });
    return ['All', ...Array.from(set).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedSector === 'All') return items;
    return items.filter((item) => item.sector === selectedSector);
  }, [items, selectedSector]);

  const gainers = useMemo(() => items.filter((item) => item.change > 0).length, [items]);
  const losers = useMemo(() => items.filter((item) => item.change < 0).length, [items]);

  if (isLoading) {
    return (
      <View className="items-center justify-center py-20">
        <ActivityIndicator color={primary} size="large" />
        <AppText className="mt-3 text-xs text-muted-foreground font-mono">Loading Nifty 50 market data...</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center">
        <AlertCircle size={28} color={destructiveColor} />
        <AppText className="mt-2 text-center text-sm font-medium text-destructive">
          {error instanceof Error ? error.message : 'Failed to load market data'}
        </AppText>
        <Pressable
          onPress={() => refetch()}
          className="mt-4 rounded-xl bg-card px-4 py-2 border border-border"
        >
          <AppText className="text-xs font-semibold text-foreground">Retry</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {/* TradingView-Style Summary Header */}
      <View className="rounded-2xl border border-border bg-card p-4">
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-1.5">
              <AppText className="text-sm font-bold">Stock Heatmap</AppText>
              <AppText className="text-xs text-muted-foreground font-medium">🇮🇳 Nifty 50</AppText>
            </View>
            <AppText className="text-xs text-muted-foreground mt-0.5">{items.length} stocks</AppText>
          </View>
          <Pressable
            onPress={() => refetch()}
            disabled={isRefetching}
            className="size-8 items-center justify-center rounded-full bg-muted"
          >
            <RefreshCw size={14} color={mutedForeground} />
          </Pressable>
        </View>

        <View className="mt-3 flex-row items-center gap-3 border-t border-border pt-3">
          <View className="flex-row items-center gap-1.5">
            <TrendingUp size={14} color={successColor} />
            <AppText className="text-xs font-semibold text-success">{gainers} advancing</AppText>
          </View>
          <AppText className="text-xs text-muted-foreground">•</AppText>
          <View className="flex-row items-center gap-1.5">
            <TrendingDown size={14} color={destructiveColor} />
            <AppText className="text-xs font-semibold text-destructive">{losers} declining</AppText>
          </View>
        </View>
      </View>

      {/* Sector Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5 py-1">
        {sectors.map((sec) => {
          const active = sec === selectedSector;
          const display = sec === 'All' ? 'All Sectors' : SECTOR_DISPLAY_MAP[sec] || sec;
          return (
            <Pressable
              key={sec}
              onPress={() => setSelectedSector(sec)}
              className={cn(
                'rounded-xl px-3 py-1.5 border',
                active ? 'bg-accent2 border-accent2' : 'bg-card border-border'
              )}
            >
              <AppText
                className={cn(
                  'text-xs font-medium',
                  active ? 'text-accent2-foreground' : 'text-muted-foreground'
                )}
              >
                {display}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 2-Column Responsive Stock Grid with TradingView styling */}
      <View className="flex-row flex-wrap justify-between gap-y-2.5">
        {filteredItems.map((item: MarketHeatmapItem) => {
          const isPositive = item.change >= 0;
          const bgColor = getTradingViewColor(item.change);
          const brandBadge = BRAND_INITIALS[item.symbol] || item.symbol.slice(0, 3);

          return (
            <Pressable
              key={item.symbol}
              onPress={() => {
                router.push({
                  pathname: '/stock-detail',
                  params: { symbol: item.symbol },
                });
              }}
              className="w-[48.5%] rounded-xl p-3 justify-between border border-black/40 shadow-sm"
              style={{ minHeight: 96, backgroundColor: bgColor }}
            >
              <View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <View className="size-5 rounded-full bg-black/25 border border-white/15 items-center justify-center">
                      <AppText className="text-[8px] font-semibold text-white">{brandBadge}</AppText>
                    </View>
                    <AppText className="text-sm font-semibold text-white">{item.symbol}</AppText>
                  </View>
                  <AppText className="text-xs font-semibold font-mono text-white">
                    {isPositive ? '+' : ''}
                    {item.change.toFixed(2)}%
                  </AppText>
                </View>
                <AppText className="text-xs text-white/70 truncate mt-1" numberOfLines={1}>
                  {item.name}
                </AppText>
              </View>

              <View className="flex-row items-center justify-between pt-2">
                <AppText className="text-xs font-mono font-semibold text-white">
                  ₹{Number(item.price).toFixed(2)}
                </AppText>
                <AppText className="text-[10px] text-white/60">
                  {SECTOR_DISPLAY_MAP[item.sector] || item.sector}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
