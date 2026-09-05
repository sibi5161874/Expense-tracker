import { Animated, Pressable, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { StatusBadge } from "@/components/common/Badge";
import { useThemeColor } from "@/lib/colors";
import { transactionTypeTone } from "@/lib/badgeTones";
import { useStaggeredEntrance } from "@/theme/useStaggeredEntrance";

export interface TransactionListItemData {
  id: string;
  date: string;
  type: "Income" | "Expense" | "Transfer";
  amount: number;
  categoryName: string | null;
  accountName: string | null;
  notes: string | null;
}

interface TransactionListItemProps {
  transaction: TransactionListItemData;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
  /** Row position in the current list — drives the entrance stagger delay. Omit for a row
   * rendered outside a list (e.g. a single preview), which then animates with no delay. */
  index?: number;
}

/**
 * Mobile equivalent of TransactionRow.tsx. A table row doesn't translate to a 375pt-wide
 * screen, so this is a stacked list-item card instead: date + type on top, category/account
 * below, amount right-aligned. Row press opens edit (no hover state on a phone); delete is
 * a small trailing icon rather than a hover-revealed action.
 */
export function TransactionListItem({ transaction, onPress, onDelete, index = 0 }: TransactionListItemProps) {
  const mutedForeground = useThemeColor("mutedForeground");
  const sign = transaction.type === "Income" ? "positive" : transaction.type === "Expense" ? "negative" : "neutral";
  const entrance = useStaggeredEntrance(index);

  return (
    <Animated.View style={entrance}>
      <Pressable
        onPress={() => onPress(transaction.id)}
        className="flex-row items-center gap-3 px-4 py-4 active:bg-accent/40"
      >
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <AppText className="text-xs text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
              {transaction.date}
            </AppText>
            <StatusBadge tone={transactionTypeTone(transaction.type)}>{transaction.type}</StatusBadge>
          </View>
          <AppText className="text-sm font-medium" numberOfLines={1}>
            {transaction.categoryName ?? "Uncategorized"}
            {transaction.accountName ? ` · ${transaction.accountName}` : ""}
          </AppText>
        </View>

        <AmountText value={transaction.amount} sign={sign} className="text-base font-semibold" />

        <Pressable
          hitSlop={14}
          onPress={() => onDelete(transaction.id)}
          accessibilityRole="button"
          accessibilityLabel="Delete transaction"
        >
          <Trash2 size={16} color={mutedForeground} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}
