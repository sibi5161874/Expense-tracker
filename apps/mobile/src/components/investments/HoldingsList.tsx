import { View } from "react-native";
import type { SymbolHolding } from "@repo/shared/logic";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";

/** Mobile equivalent of HoldingsTable.tsx. A 9-column table doesn't fit a phone width, so
 * each holding is a stacked card row instead: symbol/qty on top, cost/value/P&L below. */
export function HoldingsList({ holdings }: { holdings: SymbolHolding[] }) {
  if (holdings.length === 0) {
    return (
      <View className="items-center py-10">
        <AppText className="text-sm text-muted-foreground">
          No holdings found. Add your first investment to get started.
        </AppText>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {holdings.map((holding) => (
        <View key={`${holding.symbol}-${holding.exchange}`} className="gap-2 rounded-2xl bg-card p-4">
          <View className="flex-row items-center justify-between">
            <AppText className="text-sm font-medium">{holding.symbol}</AppText>
            <AppText className="text-xs text-muted-foreground">{holding.exchange}</AppText>
          </View>
          <View className="flex-row items-center justify-between">
            <AppText className="text-xs text-muted-foreground">
              {holding.unitsHeld} units @ avg <AmountText value={holding.avgBuyPrice} colorBySign={false} className="text-xs" />
            </AppText>
            <AmountText value={holding.currentValue} colorBySign={false} className="text-sm font-semibold" />
          </View>
          <View className="flex-row items-center justify-between">
            <AppText className="text-xs text-muted-foreground">Unrealised P&L</AppText>
            <View className="flex-row items-center gap-1.5">
              <AmountText value={holding.unrealisedPnl} className="text-xs font-medium" />
              <AppText className={holding.returnPct >= 0 ? "text-xs text-success" : "text-xs text-destructive"}>
                ({(holding.returnPct * 100).toFixed(2)}%)
              </AppText>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
