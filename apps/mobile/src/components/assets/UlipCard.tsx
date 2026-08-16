import { memo } from "react";
import { Pressable, View } from "react-native";
import { Umbrella, Pencil, Trash2 } from "lucide-react-native";
import type { UlipAsset } from "@repo/shared/types";
import { calculateDaysLeft, calculateFixedDepositStatus } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { AssetCardField as Field } from "@/components/assets/AssetCardField";
import { useThemeColor } from "@/lib/colors";
import { fixedDepositStatusTone } from "@/lib/badgeTones";

function UlipCardComponent({
  ulip,
  onEdit,
  onDelete,
}: {
  ulip: UlipAsset;
  onEdit: (ulip: UlipAsset) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");
  const daysLeft = calculateDaysLeft(ulip.maturity_date);
  const status = calculateFixedDepositStatus(ulip.maturity_date, false);

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-full bg-accent">
            <Umbrella size={18} color={accentForeground} />
          </View>
          <AppText className="font-semibold">{ulip.insurer}</AppText>
        </View>
        <StatusBadge tone={fixedDepositStatusTone(status)}>{status}</StatusBadge>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Current Fund Value" value={formatINR(ulip.current_fund_value)} />
        <Field label="Sum Assured" value={formatINR(ulip.sum_assured)} />
        <Field label="Premium" value={`${formatINR(ulip.premium_amount)} / ${ulip.premium_frequency}`} />
        <Field label="Days Left" value={String(daysLeft)} />
        <Field label="Policy Number" value={ulip.policy_number} />
      </View>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(ulip)} hitSlop={8}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(ulip.id)} hitSlop={8}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const UlipCard = memo(UlipCardComponent);
