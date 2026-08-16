import { memo } from "react";
import { Pressable, View } from "react-native";
import { Briefcase, Pencil, Trash2 } from "lucide-react-native";
import type { EpfAsset } from "@repo/shared/types";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { AssetCardField as Field } from "@/components/assets/AssetCardField";
import { useThemeColor } from "@/lib/colors";

function EpfCardComponent({
  epf,
  onEdit,
  onDelete,
}: {
  epf: EpfAsset;
  onEdit: (epf: EpfAsset) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-center gap-3">
        <View className="size-9 items-center justify-center rounded-full bg-accent">
          <Briefcase size={18} color={accentForeground} />
        </View>
        <AppText className="font-semibold">{epf.employer_name}</AppText>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Current Balance" value={formatINR(epf.current_balance)} />
        <Field label="Monthly Contribution" value={formatINR(epf.monthly_contribution)} />
        {epf.uan_number && <Field label="UAN Number" value={epf.uan_number} />}
      </View>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(epf)} hitSlop={8}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(epf.id)} hitSlop={8}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const EpfCard = memo(EpfCardComponent);
