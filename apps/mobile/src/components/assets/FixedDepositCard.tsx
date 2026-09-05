import { memo } from "react";
import { Pressable, View } from "react-native";
import { Landmark, Pencil, Trash2 } from "lucide-react-native";
import type { FixedDeposit } from "@repo/shared/types";
import { calculateDaysLeft, calculateFixedDepositStatus } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { AssetCardField as Field } from "@/components/assets/AssetCardField";
import { useThemeColor } from "@/lib/colors";
import { fixedDepositStatusTone } from "@/lib/badgeTones";

function FixedDepositCardComponent({
  fd,
  onEdit,
  onDelete,
}: {
  fd: FixedDeposit;
  onEdit: (fd: FixedDeposit) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");
  const daysLeft = calculateDaysLeft(fd.maturity_date);
  const status = calculateFixedDepositStatus(fd.maturity_date, fd.withdrawn);

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-full bg-accent">
            <Landmark size={18} color={accentForeground} />
          </View>
          <AppText className="font-semibold">{fd.bank}</AppText>
        </View>
        <StatusBadge tone={fixedDepositStatusTone(status)}>{status}</StatusBadge>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Principal" value={formatINR(fd.principal)} />
        <Field label="Interest Rate" value={`${fd.rate_pct}%`} />
        <Field label="Maturity Date" value={fd.maturity_date} />
        <Field label="Days Left" value={String(daysLeft)} />
        <Field label="Maturity Value" value={formatINR(fd.maturity_value)} />
      </View>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(fd)} hitSlop={14}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(fd.id)} hitSlop={14}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const FixedDepositCard = memo(FixedDepositCardComponent);
