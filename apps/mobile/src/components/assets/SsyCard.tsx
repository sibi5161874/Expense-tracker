import { memo } from "react";
import { Pressable, View } from "react-native";
import { Heart, Pencil, Trash2 } from "lucide-react-native";
import type { SsyAsset } from "@repo/shared/types";
import { calculateDaysLeft, calculateFixedDepositStatus, calculateSsyMaturityDate } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { AssetCardField as Field } from "@/components/assets/AssetCardField";
import { useThemeColor } from "@/lib/colors";
import { fixedDepositStatusTone } from "@/lib/badgeTones";

function SsyCardComponent({
  ssy,
  onEdit,
  onDelete,
}: {
  ssy: SsyAsset;
  onEdit: (ssy: SsyAsset) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");
  const maturityDate = calculateSsyMaturityDate(ssy.opening_date);
  const daysLeft = calculateDaysLeft(maturityDate);
  const status = calculateFixedDepositStatus(maturityDate, false);

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-full bg-accent">
            <Heart size={18} color={accentForeground} />
          </View>
          <AppText className="font-semibold">{ssy.account_holder_name}</AppText>
        </View>
        <StatusBadge tone={fixedDepositStatusTone(status)}>{status}</StatusBadge>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Current Balance" value={formatINR(ssy.current_balance)} />
        <Field label="Days Left" value={String(daysLeft)} />
        <Field label="Account Number" value={ssy.account_number} />
        <Field label="Maturity Date" value={maturityDate} />
      </View>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(ssy)} hitSlop={14}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(ssy.id)} hitSlop={14}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const SsyCard = memo(SsyCardComponent);
