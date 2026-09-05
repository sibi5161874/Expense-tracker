import { memo } from "react";
import { Pressable, View } from "react-native";
import { CalendarClock, Pencil, Trash2 } from "lucide-react-native";
import type { RecurringDepositAsset } from "@repo/shared/types";
import { calculateFixedDepositStatus } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { AssetCardField as Field } from "@/components/assets/AssetCardField";
import { useThemeColor } from "@/lib/colors";
import { fixedDepositStatusTone } from "@/lib/badgeTones";

function RecurringDepositCardComponent({
  rd,
  onEdit,
  onDelete,
}: {
  rd: RecurringDepositAsset;
  onEdit: (rd: RecurringDepositAsset) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");
  // RD maturity behaves exactly like an FD's, so it reuses the same status rule
  // rather than duplicating the date maths (RD has no early-withdrawal flag).
  const status = calculateFixedDepositStatus(rd.maturity_date, false);

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-full bg-accent">
            <CalendarClock size={18} color={accentForeground} />
          </View>
          <AppText className="font-semibold">{rd.bank}</AppText>
        </View>
        <StatusBadge tone={fixedDepositStatusTone(status)}>{status}</StatusBadge>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Monthly Installment" value={formatINR(rd.monthly_installment)} />
        <Field label="Interest Rate" value={`${rd.rate_pct}%`} />
        <Field label="Maturity Value" value={formatINR(rd.maturity_value)} />
        <Field label="Maturity Date" value={rd.maturity_date} />
      </View>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(rd)} hitSlop={14}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(rd.id)} hitSlop={14}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const RecurringDepositCard = memo(RecurringDepositCardComponent);
