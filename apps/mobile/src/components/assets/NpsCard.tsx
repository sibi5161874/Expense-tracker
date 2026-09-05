import { memo } from "react";
import { Pressable, View } from "react-native";
import { PiggyBank, Pencil, Trash2 } from "lucide-react-native";
import type { NpsAsset } from "@repo/shared/types";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { useThemeColor } from "@/lib/colors";

function NpsCardComponent({
  nps,
  onEdit,
  onDelete,
}: {
  nps: NpsAsset;
  onEdit: (nps: NpsAsset) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-full bg-accent">
            <PiggyBank size={18} color={accentForeground} />
          </View>
          <AppText className="font-semibold">{nps.pran_number}</AppText>
        </View>
        <StatusBadge tone="info">{nps.tier}</StatusBadge>
      </View>

      <View>
        <AppText className="text-xs text-muted-foreground">Current Value</AppText>
        <AppText className="text-sm font-medium">{formatINR(nps.current_value)}</AppText>
      </View>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(nps)} hitSlop={14}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(nps.id)} hitSlop={14}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const NpsCard = memo(NpsCardComponent);
