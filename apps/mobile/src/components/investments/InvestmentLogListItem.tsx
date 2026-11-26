import { Pressable, View } from "react-native";
import { ArrowDownRight, ArrowUpRight, Trash2 } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { StatusBadge } from "@/components/common/Badge";
import { useThemeColor } from "@/lib/colors";
import { useTheme } from "@/theme/ThemeProvider";
import { investmentActionTone } from "@/lib/badgeTones";

export interface InvestmentLogListItemData {
  id: string;
  date: string;
  symbol: string;
  action: string;
  quantity: number;
  price: number;
  fees: number;
  accountName: string | null;
}

interface InvestmentLogListItemProps {
  investment: InvestmentLogListItemData;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Mobile equivalent of the Investment Log row styled as an elevated card,
 * matching TransactionListItem.
 */
export function InvestmentLogListItem({
  investment,
  onPress,
  onDelete,
}: InvestmentLogListItemProps) {
  const { theme } = useTheme();
  const mutedForeground = useThemeColor("mutedForeground");
  const total = investment.quantity * investment.price + (investment.fees || 0);
  const isBuy = investment.action.toUpperCase() === "BUY";

  return (
    <View className="px-4">
      <Pressable
        onPress={() => onPress(investment.id)}
        className="mb-2.5 flex-row items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm active:bg-accent/40 active:scale-[0.99]"
      >
        {/* Action Icon Avatar */}
        <View
          className="size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: isBuy ? `${theme.primary}18` : `${theme.destructive}18`,
          }}
        >
          {isBuy ? (
            <ArrowUpRight size={20} color={theme.primary} />
          ) : (
            <ArrowDownRight size={20} color={theme.destructive} />
          )}
        </View>

        {/* Trade Details */}
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <AppText
              className="text-xs text-muted-foreground"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {investment.date}
            </AppText>
            <StatusBadge tone={investmentActionTone(investment.action)}>
              {investment.action}
            </StatusBadge>
          </View>
          <AppText className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {investment.symbol}
            {investment.accountName ? ` · ${investment.accountName}` : ""}
          </AppText>
        </View>

        {/* Amount */}
        <AmountText
          value={total}
          colorBySign={false}
          className="text-base font-bold text-foreground"
        />

        {/* Delete Action */}
        <Pressable
          hitSlop={14}
          onPress={() => onDelete(investment.id)}
          accessibilityRole="button"
          accessibilityLabel="Delete investment"
          className="p-1"
        >
          <Trash2 size={16} color={mutedForeground} />
        </Pressable>
      </Pressable>
    </View>
  );
}
