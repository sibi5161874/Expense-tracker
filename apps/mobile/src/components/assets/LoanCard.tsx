import { memo } from "react";
import { Pressable, View } from "react-native";
import { HandCoins, Pencil, Trash2 } from "lucide-react-native";
import type { LoanLiability } from "@repo/shared/types";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { AssetCardField as Field } from "@/components/assets/AssetCardField";
import { useThemeColor } from "@/lib/colors";

function LoanCardComponent({
  loan,
  onEdit,
  onDelete,
}: {
  loan: LoanLiability;
  onEdit: (loan: LoanLiability) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-center gap-3">
        <View className="size-9 items-center justify-center rounded-full bg-accent">
          <HandCoins size={18} color={accentForeground} />
        </View>
        <AppText className="font-semibold">{loan.lender}</AppText>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Outstanding" value={formatINR(loan.outstanding)} />
        <Field label="EMI" value={loan.emi != null ? formatINR(loan.emi) : "-"} />
        <Field label="Interest Rate" value={loan.interest_rate_pct != null ? `${loan.interest_rate_pct}%` : "-"} />
        <Field label="Months Left" value={loan.months_left != null ? String(loan.months_left) : "-"} />
      </View>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(loan)} hitSlop={8}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(loan.id)} hitSlop={8}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const LoanCard = memo(LoanCardComponent);
