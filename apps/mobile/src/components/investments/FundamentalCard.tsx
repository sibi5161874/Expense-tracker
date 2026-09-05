import { ActivityIndicator, View } from "react-native";
import { useStockFundamentals } from "@/hooks/useStockFundamentals";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";

function formatMarketCap(value: number | null): string {
  if (value === null) return "—";
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(0)} Cr`;
  return formatINR(value);
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value: number | null, digits = 2): string {
  return value === null ? "—" : value.toFixed(digits);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-[47%] gap-0.5">
      <AppText className="text-xs text-muted-foreground">{label}</AppText>
      <AppText className="text-sm font-semibold" style={{ fontVariant: ["tabular-nums"] }}>
        {value}
      </AppText>
    </View>
  );
}

/** Mirrors apps/web/src/components/investments/FundamentalCard.tsx — a holding's
 * fundamentals shown on its detail screen. Gating happens one level up; if this is mounted,
 * the ticker is assumed entitled. */
export function FundamentalCard({ ticker }: { ticker: string }) {
  const { data, isLoading, error } = useStockFundamentals(ticker);
  const primary = useThemeColor("primary");

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <AppText className="text-sm font-semibold">Fundamentals</AppText>

      {isLoading ? (
        <ActivityIndicator color={primary} />
      ) : error ? (
        <AppText className="text-sm text-destructive">{error.message}</AppText>
      ) : !data ? null : (
        <View className="flex-row flex-wrap gap-x-4 gap-y-3">
          <Stat label="Trailing P/E" value={formatNumber(data.trailingPE)} />
          <Stat label="Forward P/E" value={formatNumber(data.forwardPE)} />
          <Stat label="52W High" value={data.fiftyTwoWeekHigh === null ? "—" : formatINR(data.fiftyTwoWeekHigh)} />
          <Stat label="52W Low" value={data.fiftyTwoWeekLow === null ? "—" : formatINR(data.fiftyTwoWeekLow)} />
          <Stat label="Profit Margin" value={formatPercent(data.profitMargins)} />
          <Stat label="Market Cap" value={formatMarketCap(data.marketCap)} />
          <Stat label="Beta" value={formatNumber(data.beta)} />
          <Stat label="Dividend Yield" value={formatPercent(data.trailingAnnualDividendYield)} />
        </View>
      )}
    </View>
  );
}
