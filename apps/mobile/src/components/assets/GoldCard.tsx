import { memo } from "react";
import { Pressable, View } from "react-native";
import { Gem, Pencil, Trash2 } from "lucide-react-native";
import type { GoldAsset } from "@repo/shared/types";
import { calculateGoldMetrics } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { AssetCardField as Field } from "@/components/assets/AssetCardField";
import { useThemeColor } from "@/lib/colors";

function GoldCardComponent({
  gold,
  onEdit,
  onDelete,
}: {
  gold: GoldAsset;
  onEdit: (gold: GoldAsset) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");
  const metrics = calculateGoldMetrics(gold.grams, gold.rate_per_gram, gold.purchase_value);
  const pnlPositive = metrics.pnl >= 0;

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-full bg-accent">
            <Gem size={18} color={accentForeground} />
          </View>
          <AppText className="font-semibold">{gold.description}</AppText>
        </View>
        <StatusBadge tone={pnlPositive ? "success" : "destructive"}>{pnlPositive ? "Profit" : "Loss"}</StatusBadge>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Grams" value={String(gold.grams)} />
        <Field label="Rate/gram" value={formatINR(gold.rate_per_gram)} />
        <Field label="Purchase Value" value={formatINR(gold.purchase_value)} />
        <Field label="Current Value" value={formatINR(metrics.currentValue)} />
      </View>
      <AppText className={pnlPositive ? "text-sm font-medium text-success" : "text-sm font-medium text-destructive"}>
        P&L {formatINR(metrics.pnl)}
      </AppText>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(gold)} hitSlop={14}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(gold.id)} hitSlop={14}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const GoldCard = memo(GoldCardComponent);
