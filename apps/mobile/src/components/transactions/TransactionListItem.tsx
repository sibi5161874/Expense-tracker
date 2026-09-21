import { Animated, Pressable, View } from "react-native";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Trash2 } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { StatusBadge } from "@/components/common/Badge";
import { useThemeColor } from "@/lib/colors";
import { transactionTypeTone } from "@/lib/badgeTones";
import { useStaggeredEntrance } from "@/theme/useStaggeredEntrance";
import { cn } from "@/lib/cn";

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
  index?: number;
}

const TYPE_ICONS = {
  Expense: { icon: ArrowDownRight, color: "#ef4444", bg: "bg-destructive/15" },
  Income: { icon: ArrowUpRight, color: "#22c55e", bg: "bg-success/15" },
  Transfer: { icon: ArrowLeftRight, color: "#3b82f6", bg: "bg-primary/15" },
};

export function TransactionListItem({ transaction, onPress, onDelete, index = 0 }: TransactionListItemProps) {
  const mutedForeground = useThemeColor("mutedForeground");
  const sign = transaction.type === "Income" ? "positive" : transaction.type === "Expense" ? "negative" : "neutral";
  const entrance = useStaggeredEntrance(index);
  const typeConfig = TYPE_ICONS[transaction.type] ?? TYPE_ICONS.Expense;
  const Icon = typeConfig.icon;

  return (
    <Animated.View style={entrance} className="px-4">
      <Pressable
        onPress={() => onPress(transaction.id)}
        className="mb-2.5 flex-row items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm active:bg-accent/40 active:scale-[0.99] transition-all"
      >
        {/* Category / Type Icon Avatar */}
        <View className={cn("size-10 items-center justify-center rounded-2xl", typeConfig.bg)}>
          <Icon size={20} color={typeConfig.color} />
        </View>

        {/* Transaction Details */}
        <View className="flex-1 gap-1">
          <AppText className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {transaction.categoryName ?? (transaction.type === "Transfer" ? "Transfer" : "Uncategorized")}
          </AppText>
          <View className="flex-row items-center gap-1.5">
            <AppText className="text-xs text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
              {transaction.date}
            </AppText>
            {transaction.accountName && (
              <>
                <AppText className="text-xs text-muted-foreground/60">•</AppText>
                <AppText className="text-xs text-muted-foreground" numberOfLines={1}>
                  {transaction.accountName}
                </AppText>
              </>
            )}
          </View>
        </View>

        {/* Amount & Type Badge */}
        <View className="items-end gap-1">
          <AmountText value={transaction.amount} sign={sign} className="text-base font-bold" />
          <StatusBadge tone={transactionTypeTone(transaction.type)} className="text-[10px] py-0 px-1.5">
            {transaction.type}
          </StatusBadge>
        </View>

        {/* Delete Action Button */}
        <Pressable
          hitSlop={12}
          onPress={() => onDelete(transaction.id)}
          className="ml-1 rounded-full p-2 active:bg-destructive/15"
          accessibilityRole="button"
          accessibilityLabel="Delete transaction"
        >
          <Trash2 size={16} color={mutedForeground} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

