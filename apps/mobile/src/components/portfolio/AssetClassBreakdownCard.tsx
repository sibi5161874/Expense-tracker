import { useMemo } from "react";
import { View } from "react-native";
import type { SymbolHolding } from "@repo/shared/logic";
import { segmentHoldingsByAssetClass } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";

export function AssetClassBreakdownCard({ holdings }: { holdings: SymbolHolding[] }) {
  const segments = useMemo(() => segmentHoldingsByAssetClass(holdings), [holdings]);

  const totalInvested = useMemo(
    () => segments.reduce((sum, s) => sum + s.totalInvested, 0),
    [segments]
  );
  const totalCurrent = useMemo(
    () => segments.reduce((sum, s) => sum + s.totalCurrent, 0),
    [segments]
  );
  const totalPnl = totalCurrent - totalInvested;
  const totalReturnPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <AppText className="text-sm font-semibold">Asset Class Breakdown</AppText>

      {segments.length === 0 ? (
        <AppText className="py-4 text-center text-sm text-muted-foreground">
          Add holdings to see asset-class performance
        </AppText>
      ) : (
        <View className="gap-2.5">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-border pb-2">
            <AppText className="text-xs font-semibold uppercase text-muted-foreground">Asset Class</AppText>
            <View className="flex-row items-center gap-3">
              <AppText className="text-xs font-semibold uppercase text-muted-foreground">Invested</AppText>
              <AppText className="text-xs font-semibold uppercase text-muted-foreground">Current</AppText>
              <AppText className="text-xs font-semibold uppercase text-muted-foreground text-right w-14">Return</AppText>
            </View>
          </View>

          {/* Rows */}
          {segments.map((seg) => {
            const returnPctValue = seg.avgReturnPct * 100;
            return (
              <View
                key={seg.assetType}
                className="flex-row items-center justify-between border-b border-border/40 pb-2"
              >
                <View>
                  <AppText className="text-sm font-medium">{seg.assetType}</AppText>
                  <AppText className="text-[10px] text-muted-foreground">
                    {seg.holdings.length} holding{seg.holdings.length === 1 ? "" : "s"}
                  </AppText>
                </View>
                <View className="flex-row items-center gap-3">
                  <AmountText value={seg.totalInvested} colorBySign={false} className="text-xs" />
                  <AmountText value={seg.totalCurrent} colorBySign={false} className="text-xs font-medium" />
                  <AppText
                    className={`text-xs font-semibold text-right w-14 ${
                      returnPctValue >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {returnPctValue.toFixed(2)}%
                  </AppText>
                </View>
              </View>
            );
          })}

          {/* Total Footer */}
          <View className="flex-row items-center justify-between border-t-2 border-border pt-2.5">
            <AppText className="text-sm font-semibold uppercase tracking-wide">Total</AppText>
            <View className="flex-row items-center gap-3">
              <AmountText value={totalInvested} colorBySign={false} className="text-xs" />
              <AmountText value={totalCurrent} colorBySign={false} className="text-xs font-semibold" />
              <AppText
                className={`text-xs font-semibold text-right w-14 ${
                  totalReturnPct >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {totalReturnPct.toFixed(2)}%
              </AppText>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
