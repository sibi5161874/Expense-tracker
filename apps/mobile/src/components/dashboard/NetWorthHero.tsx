import { ScrollView, View, Pressable } from "react-native";
import { Landmark, TrendingUp, ShieldAlert, Wallet } from "lucide-react-native";
import { formatINR } from "@repo/shared/utils";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";
import type { NetWorthBreakdown } from "@repo/shared/logic";

interface NetWorthHeroProps {
  breakdown: NetWorthBreakdown;
  onPressItem?: (key: string) => void;
}

const CHIPS = [
  { key: "cashAndBankTotal", label: "Cash & Bank", icon: Landmark } as const,
  { key: "portfolioValue", label: "Investments", icon: TrendingUp } as const,
  { key: "liabilitiesTotal", label: "Liabilities", icon: ShieldAlert, negate: true } as const,
];

/**
 * Awwwards-Craft Net Worth Hero.
 * Dramatic typography, slate-obsidian elevated container, tabular numbers,
 * and tactile micro-cards for wealth segmentation.
 */
export function NetWorthHero({ breakdown, onPressItem }: NetWorthHeroProps) {
  const { theme } = useTheme();
  const positive = breakdown.netWorth >= 0;

  return (
    <View className="gap-5 py-2">
      {/* Primary Net Worth Display */}
      <View className="gap-1">
        <View className="flex-row items-center gap-2">
          <View
            className="size-5 items-center justify-center rounded-full"
            style={{ backgroundColor: `${theme.primary}20` }}
          >
            <Wallet size={11} color={theme.primary} />
          </View>
          <AppText className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Total Net Worth
          </AppText>
        </View>

        <AppText
          className={positive ? "text-success font-extrabold tracking-tight" : "text-destructive font-extrabold tracking-tight"}
          style={{
            fontSize: 40,
            lineHeight: 48,
            letterSpacing: -1,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatINR(breakdown.netWorth)}
        </AppText>
      </View>

      {/* Horizontal Wealth Segmentation Tactile Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {CHIPS.map(({ key, label, icon: Icon, negate }) => {
          const raw = breakdown[key as "cashAndBankTotal" | "portfolioValue" | "liabilitiesTotal"];
          const value = negate ? -raw : raw;

          return (
            <Pressable
              key={key}
              onPress={() => onPressItem?.(key)}
              className="flex-row items-center gap-3 rounded-2xl border border-border/70 p-3 shadow-sm active:scale-[0.98] active:bg-accent/30"
              style={{
                backgroundColor: theme.surfaceContainer || theme.card,
                minWidth: 140,
              }}
            >
              <View
                className="size-8 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: negate
                    ? `${theme.destructive}18`
                    : `${theme.primary}18`,
                }}
              >
                <Icon
                  size={15}
                  color={negate ? theme.destructive : theme.primary}
                />
              </View>

              <View className="gap-0.5">
                <AppText className="text-[11px] font-medium text-muted-foreground">
                  {label}
                </AppText>
                <AppText
                  className={negate ? "text-xs font-bold text-destructive" : "text-xs font-bold text-foreground"}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatINR(value)}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
