import { Pressable, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { StatusBadge } from "@/components/common/Badge";
import { useThemeColor } from "@/lib/colors";
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

/** Mobile equivalent of the Investment Log table row — see TransactionListItem.tsx for the
 * same stacked-card rationale (a wide table doesn't fit a phone screen). */
export function InvestmentLogListItem({ investment, onPress, onDelete }: InvestmentLogListItemProps) {
  const mutedForeground = useThemeColor("mutedForeground");
  const total = investment.quantity * investment.price + (investment.fees || 0);

  return (
    <Pressable
      onPress={() => onPress(investment.id)}
      className="flex-row items-center gap-3 px-4 py-4 active:bg-accent/40"
    >
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <AppText className="text-xs text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
            {investment.date}
          </AppText>
          <StatusBadge tone={investmentActionTone(investment.action)}>{investment.action}</StatusBadge>
        </View>
        <AppText className="text-sm font-medium" numberOfLines={1}>
          {investment.symbol}
          {investment.accountName ? ` · ${investment.accountName}` : ""}
        </AppText>
      </View>

      <AmountText value={total} colorBySign={false} className="text-base font-semibold" />

      <Pressable hitSlop={8} onPress={() => onDelete(investment.id)}>
        <Trash2 size={16} color={mutedForeground} />
      </Pressable>
    </Pressable>
  );
}
