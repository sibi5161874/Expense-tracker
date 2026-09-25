import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react-native";
import type { SymbolHolding } from "@repo/shared/logic";
import { estimateTaxSavings } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { useThemeColor } from "@/lib/colors";

const MAX_VISIBLE_ROWS = 8;

export function LossMakingHoldingsCard({ holdings }: { holdings: SymbolHolding[] }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const destructive = useThemeColor("destructive");
  const success = useThemeColor("success");
  const primary = useThemeColor("primary");
  const mutedForeground = useThemeColor("mutedForeground");

  const losingHoldings = useMemo(() => {
    return holdings
      .filter((h) => h.unrealisedPnl < 0 || h.returnPct < 0)
      .sort((a, b) => a.returnPct - b.returnPct); // worst first
  }, [holdings]);

  const totalUnrealizedLoss = useMemo(() => {
    return losingHoldings.reduce((sum, h) => sum + Math.abs(h.unrealisedPnl), 0);
  }, [losingHoldings]);

  const estimatedTaxSavings = useMemo(() => {
    return estimateTaxSavings(totalUnrealizedLoss);
  }, [totalUnrealizedLoss]);

  if (losingHoldings.length === 0) {
    return null;
  }

  const visibleHoldings = losingHoldings.slice(0, MAX_VISIBLE_ROWS);
  const overflowCount = losingHoldings.length - MAX_VISIBLE_ROWS;

  return (
    <View className="gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
      {/* Header */}
      <Pressable
        onPress={() => setIsExpanded((prev) => !prev)}
        className="flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-2">
          <AlertTriangle size={16} color={destructive} />
          <AppText className="text-sm font-semibold text-destructive">
            Loss-Making Holdings ({losingHoldings.length})
          </AppText>
        </View>
        {isExpanded ? (
          <ChevronUp size={16} color={destructive} />
        ) : (
          <ChevronDown size={16} color={destructive} />
        )}
      </Pressable>

      {/* Content */}
      {isExpanded && (
        <View className="gap-3">
          {/* Table Header */}
          <View className="flex-row items-center justify-between border-b border-destructive/20 pb-1.5 pt-1">
            <AppText className="text-xs font-semibold uppercase text-destructive/80">Symbol</AppText>
            <View className="flex-row items-center gap-4">
              <AppText className="text-xs font-semibold uppercase text-destructive/80">Invested</AppText>
              <AppText className="text-xs font-semibold uppercase text-destructive/80">Current</AppText>
              <AppText className="text-xs font-semibold uppercase text-destructive/80 text-right w-14">P&L %</AppText>
            </View>
          </View>

          {/* Rows */}
          {visibleHoldings.map((h) => (
            <View
              key={`${h.symbol}-${h.exchange}`}
              className="flex-row items-center justify-between border-b border-destructive/10 pb-2"
            >
              <View>
                <AppText className="text-sm font-medium">{h.symbol}</AppText>
                <AppText className="text-[10px] text-muted-foreground">{h.assetType || "Stock"}</AppText>
              </View>
              <View className="flex-row items-center gap-4">
                <AmountText value={h.invested} colorBySign={false} className="text-xs" />
                <AmountText value={h.currentValue} colorBySign={false} className="text-xs" />
                <AppText className="text-xs font-semibold text-destructive text-right w-14">
                  {(h.returnPct * 100).toFixed(2)}%
                </AppText>
              </View>
            </View>
          ))}

          {overflowCount > 0 && (
            <AppText className="text-xs font-medium text-destructive/80 pt-0.5">
              + {overflowCount} more — view full list below
            </AppText>
          )}

          {/* Footer */}
          <View className="gap-2 border-t border-destructive/20 pt-3">
            <View className="flex-row items-center justify-between">
              <AppText className="text-xs text-muted-foreground">Total Unrealized Loss:</AppText>
              <AppText className="text-sm font-semibold text-destructive">
                {formatINR(totalUnrealizedLoss)}
              </AppText>
            </View>

            <View className="flex-row items-center justify-between">
              <AppText className="text-xs text-muted-foreground">Estimated Tax Savings (15%):</AppText>
              <AppText className="text-sm font-semibold text-success">
                {formatINR(estimatedTaxSavings)}
              </AppText>
            </View>

            <Pressable
              onPress={() => router.push("/(app)/reports")}
              className="pt-1 active:opacity-70"
            >
              <AppText className="text-xs font-medium text-primary">
                View Tax-Loss Harvesting Report →
              </AppText>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
