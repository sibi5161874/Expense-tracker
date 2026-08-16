import { memo } from "react";
import { Pressable, View } from "react-native";
import { ShieldCheck, Pencil, Trash2 } from "lucide-react-native";
import type { InsurancePolicy } from "@repo/shared/types";
import { calculateDaysUntilDue, calculatePremiumStatus } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { AssetCardField as Field } from "@/components/assets/AssetCardField";
import { useThemeColor } from "@/lib/colors";
import { premiumStatusTone } from "@/lib/badgeTones";

function InsuranceCardComponent({
  policy,
  onEdit,
  onDelete,
}: {
  policy: InsurancePolicy;
  onEdit: (policy: InsurancePolicy) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");
  const status = calculatePremiumStatus(policy.premium_due_date);
  const daysUntilDue = calculateDaysUntilDue(policy.premium_due_date);

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-full bg-accent">
            <ShieldCheck size={18} color={accentForeground} />
          </View>
          <View className="flex-1">
            <AppText className="font-semibold" numberOfLines={1}>
              {policy.insurer}
            </AppText>
            <AppText className="text-sm text-muted-foreground">{policy.policy_type}</AppText>
          </View>
        </View>
        <StatusBadge tone={premiumStatusTone(status)}>{status}</StatusBadge>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Coverage" value={formatINR(policy.coverage_amount)} />
        <Field label="Premium" value={formatINR(policy.premium_amount)} />
        <Field
          label="Due Date"
          value={`${policy.premium_due_date} (${daysUntilDue >= 0 ? `${daysUntilDue}d` : `${Math.abs(daysUntilDue)}d overdue`})`}
        />
        <Field label="Policy Number" value={policy.policy_number} />
      </View>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(policy)} hitSlop={8}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(policy.id)} hitSlop={8}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const InsuranceCard = memo(InsuranceCardComponent);
