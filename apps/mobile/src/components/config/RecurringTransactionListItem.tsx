import { Pressable, View } from "react-native";
import { Pencil, Trash2, Pause, Play } from "lucide-react-native";
import type { getRecurringTransactions } from "@repo/shared/queries/recurringTransactions";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { transactionTypeTone } from "@/lib/badgeTones";
import { useThemeColor } from "@/lib/colors";

type RecurringTransaction = NonNullable<Awaited<ReturnType<typeof getRecurringTransactions>>>[number];

/** Mobile equivalent of RecurringTransactionRow.tsx. */
export function RecurringTransactionListItem({
  recurringTransaction,
  onEdit,
  onDelete,
  onToggleActive,
  isDeleting,
}: {
  recurringTransaction: RecurringTransaction;
  onEdit: (rt: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onToggleActive: (rt: RecurringTransaction) => void;
  isDeleting: boolean;
}) {
  const mutedForeground = useThemeColor("mutedForeground");
  const accentForeground = useThemeColor("accentForeground");
  const label = recurringTransaction.notes || recurringTransaction.category?.name || "Untitled";
  const nextRun = new Date(recurringTransaction.next_run_date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Pressable
      onPress={() => onEdit(recurringTransaction)}
      className="gap-2 rounded-2xl bg-card px-4 py-3.5 active:opacity-70"
      style={{ opacity: recurringTransaction.is_active ? 1 : 0.6 }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-2">
          <AppText className="text-sm font-medium" numberOfLines={1}>
            {label}
          </AppText>
          <StatusBadge tone={transactionTypeTone(recurringTransaction.type)}>{recurringTransaction.type}</StatusBadge>
        </View>
        <AppText className="text-sm font-medium" style={{ fontVariant: ["tabular-nums"] }}>
          {formatINR(recurringTransaction.amount)}
        </AppText>
      </View>
      <View className="flex-row items-center justify-between">
        <AppText className="text-xs text-muted-foreground">
          {recurringTransaction.frequency} · {recurringTransaction.is_active ? `Next: ${nextRun}` : "Paused"}
        </AppText>
        <View className="flex-row items-center gap-3">
          <Pressable
            hitSlop={14}
            onPress={() => onToggleActive(recurringTransaction)}
            accessibilityRole="button"
            accessibilityLabel={recurringTransaction.is_active ? "Pause recurring transaction" : "Resume recurring transaction"}
          >
            {recurringTransaction.is_active ? <Pause size={15} color={mutedForeground} /> : <Play size={15} color={mutedForeground} />}
          </Pressable>
          <Pencil size={15} color={accentForeground} />
          <Pressable
            hitSlop={14}
            onPress={() => onDelete(recurringTransaction.id)}
            disabled={isDeleting}
            accessibilityRole="button"
            accessibilityLabel="Delete recurring transaction"
          >
            <Trash2 size={15} color={mutedForeground} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
