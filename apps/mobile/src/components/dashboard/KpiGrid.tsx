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
 * Mobile equivalent of KpiStrip.tsx — each stat is its own flat rounded-2xl card in a 2x2
 * grid, no divider lines between cells (design spec §4: hierarchy comes from weight/size/
 * color, never borders). Meaning comes from the value's color plus a small inline icon.
 */
export function KpiGrid({ items }: { items: KpiStatItem[] }) {
  const mutedForeground = useThemeColor("mutedForeground");

  return (
    <View className="flex-row flex-wrap gap-3">
      {items.map(({ label, icon: Icon, tone = "neutral", value }) => (
        <View key={label} className="w-[48%] gap-1.5 rounded-2xl bg-muted/40 p-4">
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
