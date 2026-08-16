import { memo } from "react";
import { Pressable, View } from "react-native";
import { Coins, Pencil, Trash2 } from "lucide-react-native";
import type { SgbAsset } from "@repo/shared/types";
import {
  calculateDaysLeft,
  calculateFixedDepositStatus,
  calculateGoldMetrics,
  calculateSgbMaturityDate,
} from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { AssetCardField as Field } from "@/components/assets/AssetCardField";
import { useThemeColor } from "@/lib/colors";
import { fixedDepositStatusTone } from "@/lib/badgeTones";

function SgbCardComponent({
  sgb,
  onEdit,
  onDelete,
}: {
  sgb: SgbAsset;
  onEdit: (sgb: SgbAsset) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");
  const maturityDate = calculateSgbMaturityDate(sgb.issue_date);
  const daysLeft = calculateDaysLeft(maturityDate);
  const status = calculateFixedDepositStatus(maturityDate, false);
  const { currentValue, pnl } = calculateGoldMetrics(sgb.units_held, sgb.rate_per_gram, sgb.units_held * sgb.issue_price);

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-full bg-accent">
            <Coins size={18} color={accentForeground} />
          </View>
          <AppText className="font-semibold">{sgb.units_held}g SGB</AppText>
        </View>
        <StatusBadge tone={fixedDepositStatusTone(status)}>{status}</StatusBadge>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Current Value" value={formatINR(currentValue)} />
        <Field label="Days Left" value={String(daysLeft)} />
        <Field label="Maturity Date" value={maturityDate} />
      </View>
      <AppText className={pnl >= 0 ? "text-sm font-medium text-success" : "text-sm font-medium text-destructive"}>
        P&L {formatINR(pnl)}
      </AppText>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(sgb)} hitSlop={8}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(sgb.id)} hitSlop={8}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const SgbCard = memo(SgbCardComponent);
