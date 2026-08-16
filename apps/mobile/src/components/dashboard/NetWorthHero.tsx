import { ScrollView, View } from "react-native";
import { formatINR } from "@repo/shared/utils";
import { AppText } from "@/components/common/AppText";
import type { NetWorthBreakdown } from "@repo/shared/logic";

interface NetWorthHeroProps {
  breakdown: NetWorthBreakdown;
}

const CHIPS = [
  { key: "cashAndBankTotal", label: "Cash & Bank" } as const,
  { key: "portfolioValue", label: "Investments" } as const,
  { key: "liabilitiesTotal", label: "Liabilities", negate: true } as const,
];

/**
 * Mobile equivalent of NetWorthHero.tsx — no card/border, same dramatic type-scale idea. The
 * web version lays breakdown chips in a fixed row divided by hairlines; a phone is too narrow
 * for three currency values across, so this scrolls horizontally instead of wrapping — the
 * mobile-appropriate swap for a layout that doesn't fit rather than shrinking text to fit.
 */
export function NetWorthHero({ breakdown }: NetWorthHeroProps) {
  const positive = breakdown.netWorth >= 0;

  return (
    <View className="gap-6 py-4">
      <View>
        <AppText className="text-sm uppercase tracking-wide text-muted-foreground">Net Worth</AppText>
        <AppText
          className={positive ? "text-success" : "text-destructive"}
          style={{ fontSize: 44, fontWeight: "500", letterSpacing: -0.5, fontVariant: ["tabular-nums"] }}
        >
          {formatINR(breakdown.netWorth)}
        </AppText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-6">
          {CHIPS.map(({ key, label, negate }) => {
            const raw = breakdown[key as "cashAndBankTotal" | "portfolioValue" | "liabilitiesTotal"];
            const value = negate ? -raw : raw;
            return (
              <View key={key} className="gap-1">
                <AppText className="text-xs text-muted-foreground">{label}</AppText>
                <AppText
                  className={negate ? "text-destructive" : "text-foreground"}
                  style={{ fontSize: 14, fontWeight: "500", fontVariant: ["tabular-nums"] }}
                >
                  {formatINR(value)}
                </AppText>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
