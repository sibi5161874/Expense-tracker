import { Pressable, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { cn } from "@/lib/cn";
import { useThemeColor } from "@/lib/colors";
import { useTheme } from "@/theme/ThemeProvider";
import type { BadgeTone } from "@/lib/badgeTones";

export interface KpiStatItem {
  label: string;
  icon: LucideIcon;
  tone?: BadgeTone;
  value: number | string;
  onPress?: () => void;
}

const TEXT_TONE: Record<BadgeTone, string> = {
  success: "text-success",
  destructive: "text-destructive",
  warning: "text-warning-foreground",
  info: "text-info",
  neutral: "text-foreground",
};

/**
 * Mobile Awwwards-Craft KPI Grid.
 * Tactile micro-cards in a 2x2 grid with hairline slate borders,
 * icon container accents, and strict tabular numbers.
 */
export function KpiGrid({ items }: { items: KpiStatItem[] }) {
  const { theme } = useTheme();
  const mutedForeground = useThemeColor("mutedForeground");

  return (
    <View className="flex-row flex-wrap justify-between gap-y-3">
      {items.map(({ label, icon: Icon, tone = "neutral", value, onPress }) => {
        const isSuccess = tone === "success";
        const isDestructive = tone === "destructive";
        const isWarning = tone === "warning";

        const iconColor = isSuccess
          ? theme.success
          : isDestructive
            ? theme.destructive
            : isWarning
              ? theme.warning
              : theme.primary;

        const iconBg = isSuccess
          ? `${theme.success}15`
          : isDestructive
            ? `${theme.destructive}15`
            : isWarning
              ? `${theme.warning}15`
              : `${theme.primary}15`;

        return (
          <Pressable
            key={label}
            onPress={onPress}
            disabled={!onPress}
            className="w-[48.5%] gap-2 rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm active:scale-[0.98] active:bg-accent/40"
          >
            {/* Header: Icon Container + Micro Label */}
            <View className="flex-row items-center gap-2">
              <View
                className="size-7 items-center justify-center rounded-xl"
                style={{ backgroundColor: iconBg }}
              >
                <Icon size={14} color={iconColor} />
              </View>
              <AppText className="flex-1 text-xs font-medium text-muted-foreground" numberOfLines={1}>
                {label}
              </AppText>
            </View>

            {/* Value with tabular numerals */}
            {typeof value === "number" ? (
              <AmountText
                value={value}
                colorBySign={false}
                sign="neutral"
                className={cn("text-lg font-bold tracking-tight", TEXT_TONE[tone])}
              />
            ) : (
              <AppText
                className={cn("text-lg font-bold tracking-tight", TEXT_TONE[tone])}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {value}
              </AppText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
