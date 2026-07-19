import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { cn } from "@/lib/cn";
import { useThemeColor } from "@/lib/colors";
import type { BadgeTone } from "@/lib/badgeTones";

export interface KpiStatItem {
  label: string;
  icon: LucideIcon;
  tone?: BadgeTone;
  value: number | string;
}

const TEXT_TONE: Record<BadgeTone, string> = {
  success: "text-success",
  destructive: "text-destructive",
  warning: "text-warning-foreground",
  info: "text-info",
  neutral: "text-foreground",
};

/**
 * Mobile equivalent of KpiStrip.tsx — web lays 4 stats in one row divided by vertical hairlines;
 * a phone screen can't fit 4 currency values across, so this wraps to a 2x2 grid within the same
 * shared soft container, divided both ways. Same rule carries over: no icon-in-circle badges,
 * meaning comes from the value's color plus a small inline icon.
 */
export function KpiGrid({ items }: { items: KpiStatItem[] }) {
  const mutedForeground = useThemeColor("mutedForeground");

  return (
    <View className="flex-row flex-wrap overflow-hidden rounded-2xl bg-muted/40">
      {items.map(({ label, icon: Icon, tone = "neutral", value }, i) => (
        <View
          key={label}
          className={cn(
            "w-1/2 gap-1.5 p-4",
            i % 2 === 1 && "border-l border-border",
            i >= 2 && "border-t border-border"
          )}
        >
          <View className="flex-row items-center gap-1.5">
            <Icon size={14} color={mutedForeground} />
            <AppText className="text-xs text-muted-foreground">{label}</AppText>
          </View>
          {typeof value === "number" ? (
            <AmountText value={value} colorBySign={false} sign="neutral" className={cn("text-lg font-semibold", TEXT_TONE[tone])} />
          ) : (
            <AppText className={cn("text-lg font-semibold", TEXT_TONE[tone])} style={{ fontVariant: ["tabular-nums"] }}>
              {value}
            </AppText>
          )}
        </View>
      ))}
    </View>
  );
}
