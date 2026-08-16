import { View } from "react-native";
import { AppText } from "@/components/common/AppText";

/** Shared label/value pair used inside every asset card's stat grid. */
export function AssetCardField({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[40%] gap-0.5">
      <AppText className="text-xs text-muted-foreground">{label}</AppText>
      <AppText className="text-sm font-medium">{value}</AppText>
    </View>
  );
}
