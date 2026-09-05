import { router } from "expo-router";
import { View } from "react-native";
import { TrendingDown } from "lucide-react-native";
import { useEntitlements } from "@/hooks/useEntitlements";
import { calculateUnrealizedLosses, type SymbolHolding } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { ProBlurredPreview } from "@/components/shared/ProGate";
import { useThemeColor } from "@/lib/colors";

const LTCG_OFFSET_LIMIT = 100_000;

// Static, no real holdings — shown blurred to free-tier users.
const PLACEHOLDER_LOSERS: SymbolHolding[] = [
  { symbol: "STOCKA", exchange: "NSE", assetType: "Stock", unitsHeld: 20, avgBuyPrice: 500, currentPrice: 420, currentValue: 8400, invested: 10000, unrealisedPnl: -1600, returnPct: -0.16, lotCount: 1, hasLivePrice: true },
  { symbol: "STOCKB", exchange: "NSE", assetType: "Stock", unitsHeld: 10, avgBuyPrice: 1200, currentPrice: 1080, currentValue: 10800, invested: 12000, unrealisedPnl: -1200, returnPct: -0.1, lotCount: 1, hasLivePrice: true },
];

function LosersList({ losers }: { losers: SymbolHolding[] }) {
  return (
    <View className="mt-4 gap-2">
      {losers.map((h) => (
        <View key={`${h.symbol}-${h.exchange}`} className="flex-row items-center justify-between">
          <AppText className="text-sm font-medium">{h.symbol}</AppText>
          <AppText className="text-sm text-destructive" style={{ fontVariant: ["tabular-nums"] }}>
            {formatINR(h.unrealisedPnl)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function TaxLossBody({ holdings }: { holdings: SymbolHolding[] }) {
  const destructive = useThemeColor("destructive");
  const mutedForeground = useThemeColor("mutedForeground");
  const { totalLoss, topLosers } = calculateUnrealizedLosses(holdings);

  if (totalLoss === 0) {
    return (
      <View className="gap-2 rounded-2xl bg-card p-5">
        <View className="flex-row items-center gap-2">
          <TrendingDown size={18} color={mutedForeground} />
          <AppText className="text-sm font-semibold">Tax-Loss Harvesting</AppText>
        </View>
        <AppText className="text-sm text-muted-foreground">No unrealized losses right now — nothing to harvest.</AppText>
      </View>
    );
  }

  return (
    <View className="gap-2 rounded-2xl bg-card p-5">
      <View className="flex-row items-center gap-2">
        <TrendingDown size={18} color={destructive} />
        <AppText className="text-sm font-semibold">Tax-Loss Harvesting</AppText>
      </View>
      <AppText className="text-sm text-muted-foreground">
        You have <AppText className="font-semibold text-destructive">{formatINR(totalLoss)}</AppText> in unrealized
        losses. You can offset up to {formatINR(LTCG_OFFSET_LIMIT)} of your Capital Gains tax this year!
      </AppText>
      <LosersList losers={topLosers} />
    </View>
  );
}

/** Mirrors apps/web/src/components/investments/TaxLossHarvestingCard.tsx — surfaces
 * unrealized losses worth harvesting before the financial year closes. Not tax advice (no
 * cost-inflation indexing, no LTCG/STCG classification by holding period). */
export function TaxLossHarvestingCard({ holdings }: { holdings: SymbolHolding[] }) {
  const { hasFeature } = useEntitlements();

  return (
    <ProBlurredPreview
      feature="taxLossHarvesting"
      title="Tax-Loss Harvesting"
      description="Find unrealized losses worth harvesting before the financial year closes."
      onUpgradePress={() => router.push("/(app)/billing")}
    >
      {hasFeature("taxLossHarvesting") ? <TaxLossBody holdings={holdings} /> : <TaxLossBody holdings={PLACEHOLDER_LOSERS} />}
    </ProBlurredPreview>
  );
}
