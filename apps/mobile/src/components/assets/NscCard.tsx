import { memo } from "react";
import { Pressable, View } from "react-native";
import { ScrollText, Pencil, Trash2 } from "lucide-react-native";
import type { NscAsset } from "@repo/shared/types";
import { calculateFixedDepositStatus } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { AssetCardField as Field } from "@/components/assets/AssetCardField";
import { useThemeColor } from "@/lib/colors";
import { fixedDepositStatusTone } from "@/lib/badgeTones";

function NscCardComponent({
  nsc,
  onEdit,
  onDelete,
}: {
  nsc: NscAsset;
  onEdit: (nsc: NscAsset) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");
  const status = calculateFixedDepositStatus(nsc.maturity_date, false);

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-full bg-accent">
            <ScrollText size={18} color={accentForeground} />
          </View>
          <AppText className="font-semibold">NSC · {nsc.certificate_number}</AppText>
        </View>
        <StatusBadge tone={fixedDepositStatusTone(status)}>{status}</StatusBadge>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Purchase Value" value={formatINR(nsc.purchase_value)} />
        <Field label="Maturity Value" value={formatINR(nsc.maturity_value)} />
        <Field label="Interest Rate" value={`${nsc.rate_pct}%`} />
        <Field label="Maturity Date" value={nsc.maturity_date} />
      </View>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(nsc)} hitSlop={14}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(nsc.id)} hitSlop={14}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const NscCard = memo(NscCardComponent);
