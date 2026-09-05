import { Pressable, View } from "react-native";
import { Pencil, Trash2 } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";

/** Generic compact row for the Config screen's 3 sub-lists (Accounts/Categories/Budgets) —
 * flat, no lines between items, matching every other list in the app. */
export function ConfigListItem({
  title,
  subtitle,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mutedForeground = useThemeColor("mutedForeground");
  const accentForeground = useThemeColor("accentForeground");

  return (
    <Pressable onPress={onEdit} className="flex-row items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3.5 active:opacity-70">
      <View className="flex-1">
        <AppText className="text-sm font-medium" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle && <AppText className="text-xs text-muted-foreground">{subtitle}</AppText>}
      </View>
      <View className="flex-row items-center gap-3">
        <Pencil size={15} color={accentForeground} />
        <Pressable hitSlop={14} onPress={onDelete} accessibilityRole="button" accessibilityLabel={`Delete ${title}`}>
          <Trash2 size={15} color={mutedForeground} />
        </Pressable>
      </View>
    </Pressable>
  );
}
