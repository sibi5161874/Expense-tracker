import { memo } from "react";
import { Pressable, View } from "react-native";
import { Car, Pencil, Trash2 } from "lucide-react-native";
import type { VehicleAsset } from "@repo/shared/types";
import { calculateRealEstatePnl } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { AssetCardField as Field } from "@/components/assets/AssetCardField";
import { useThemeColor } from "@/lib/colors";

function VehicleCardComponent({
  vehicle,
  onEdit,
  onDelete,
}: {
  vehicle: VehicleAsset;
  onEdit: (vehicle: VehicleAsset) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");
  // Same "current minus purchase" rule as real estate — vehicles almost always
  // depreciate, so this reads as a loss by design rather than being a bug.
  const change = calculateRealEstatePnl(vehicle.purchase_value, vehicle.current_value);

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-full bg-accent">
            <Car size={18} color={accentForeground} />
          </View>
          <View className="flex-1">
            <AppText className="font-semibold">{vehicle.description}</AppText>
            <AppText className="text-xs text-muted-foreground">
              {vehicle.vehicle_type}
              {vehicle.registration_number ? ` · ${vehicle.registration_number}` : ""}
            </AppText>
          </View>
        </View>
        <StatusBadge tone={change >= 0 ? "success" : "destructive"}>
          {change >= 0 ? "Appreciated" : "Depreciated"}
        </StatusBadge>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Purchase Value" value={formatINR(vehicle.purchase_value)} />
        <Field label="Current Value" value={formatINR(vehicle.current_value)} />
        <Field label="Change" value={formatINR(change)} />
      </View>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(vehicle)} hitSlop={14}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(vehicle.id)} hitSlop={14}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const VehicleCard = memo(VehicleCardComponent);
