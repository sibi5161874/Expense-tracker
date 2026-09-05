import { memo } from "react";
import { Pressable, View } from "react-native";
import { Home, Pencil, Trash2 } from "lucide-react-native";
import type { RealEstateAsset } from "@repo/shared/types";
import { calculateRealEstatePnl } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { AssetCardField as Field } from "@/components/assets/AssetCardField";
import { useThemeColor } from "@/lib/colors";

function RealEstateCardComponent({
  property,
  onEdit,
  onDelete,
}: {
  property: RealEstateAsset;
  onEdit: (property: RealEstateAsset) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");
  const pnl = calculateRealEstatePnl(property.purchase_value, property.current_value);

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-full bg-accent">
            <Home size={18} color={accentForeground} />
          </View>
          <View className="flex-1">
            <AppText className="font-semibold">{property.description}</AppText>
            <AppText className="text-xs text-muted-foreground">
              {property.property_type}
              {property.location ? ` · ${property.location}` : ""}
            </AppText>
          </View>
        </View>
        <StatusBadge tone={pnl >= 0 ? "success" : "destructive"}>{pnl >= 0 ? "Profit" : "Loss"}</StatusBadge>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Purchase Value" value={formatINR(property.purchase_value)} />
        <Field label="Current Value" value={formatINR(property.current_value)} />
        <Field label="P&L" value={formatINR(pnl)} />
      </View>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(property)} hitSlop={14}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(property.id)} hitSlop={14}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const RealEstateCard = memo(RealEstateCardComponent);
