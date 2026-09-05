import { Pressable, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { StatusBadge } from "@/components/common/Badge";
import { useThemeColor } from "@/lib/colors";
import { cashbookFlowTone } from "@/lib/badgeTones";

export interface CashbookListItemData {
  id: string;
  date: string;
  counterparty: string;
  flow: "Gave" | "Received";
  amount: number;
  dueDate: string | null;
}

interface CashbookListItemProps {
  entry: CashbookListItemData;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CashbookListItem({ entry, onPress, onDelete }: CashbookListItemProps) {
  const mutedForeground = useThemeColor("mutedForeground");

  return (
    <Pressable onPress={() => onPress(entry.id)} className="flex-row items-center gap-3 px-4 py-4 active:bg-accent/40">
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <AppText className="text-xs text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
            {entry.date}
          </AppText>
          <StatusBadge tone={cashbookFlowTone(entry.flow)}>{entry.flow}</StatusBadge>
        </View>
        <AppText className="text-sm font-medium" numberOfLines={1}>
          {entry.counterparty}
          {entry.dueDate ? ` · due ${entry.dueDate}` : ""}
        </AppText>
      </View>

      <AmountText value={entry.amount} colorBySign={false} className="text-base font-semibold" />

      <Pressable
        hitSlop={14}
        onPress={() => onDelete(entry.id)}
        accessibilityRole="button"
        accessibilityLabel="Delete entry"
      >
        <Trash2 size={16} color={mutedForeground} />
      </Pressable>
    </Pressable>
  );
}
