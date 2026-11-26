import { Pressable, View } from "react-native";
import { ArrowDownRight, ArrowUpRight, Trash2 } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { StatusBadge } from "@/components/common/Badge";
import { useThemeColor } from "@/lib/colors";
import { useTheme } from "@/theme/ThemeProvider";
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

/**
 * Mobile equivalent of Cashbook list item styled as an elevated card,
 * matching TransactionListItem.
 */
export function CashbookListItem({ entry, onPress, onDelete }: CashbookListItemProps) {
  const { theme } = useTheme();
  const mutedForeground = useThemeColor("mutedForeground");
  const isReceived = entry.flow === "Received";

  return (
    <View className="px-4">
      <Pressable
        onPress={() => onPress(entry.id)}
        className="mb-2.5 flex-row items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm active:bg-accent/40 active:scale-[0.99]"
      >
        {/* Flow Icon Avatar */}
        <View
          className="size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: isReceived ? `${theme.primary}18` : `${theme.destructive}18`,
          }}
        >
          {isReceived ? (
            <ArrowDownRight size={20} color={theme.primary} />
          ) : (
            <ArrowUpRight size={20} color={theme.destructive} />
          )}
        </View>

        {/* Counterparty & Date Details */}
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <AppText
              className="text-xs text-muted-foreground"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {entry.date}
            </AppText>
            <StatusBadge tone={cashbookFlowTone(entry.flow)}>{entry.flow}</StatusBadge>
          </View>
          <AppText className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {entry.counterparty}
            {entry.dueDate ? ` · due ${entry.dueDate}` : ""}
          </AppText>
        </View>

        <AmountText
          value={entry.amount}
          colorBySign={false}
          className="text-base font-bold text-foreground"
        />

        <Pressable
          hitSlop={14}
          onPress={() => onDelete(entry.id)}
          accessibilityRole="button"
          accessibilityLabel="Delete entry"
          className="p-1"
        >
          <Trash2 size={16} color={mutedForeground} />
        </Pressable>
      </Pressable>
    </View>
  );
}
