import { memo } from "react";
import { Pressable, View } from "react-native";
import { Coins, Pencil, Trash2 } from "lucide-react-native";
import type { CryptoAsset } from "@repo/shared/types";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { AssetCardField as Field } from "@/components/assets/AssetCardField";
import { useThemeColor } from "@/lib/colors";

function CryptoCardComponent({
  crypto,
  onEdit,
  onDelete,
}: {
  crypto: CryptoAsset;
  onEdit: (crypto: CryptoAsset) => void;
  onDelete: (id: string) => void;
}) {
  const accentForeground = useThemeColor("accentForeground");
  const invested = crypto.quantity * crypto.buy_price;
  const currentValue = crypto.quantity * crypto.current_price;
  const pnl = currentValue - invested;
  const pnlPositive = pnl >= 0;

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-full bg-accent">
            <Coins size={18} color={accentForeground} />
          </View>
          <View className="flex-1">
            <AppText className="font-semibold">
              {crypto.symbol.toUpperCase()}
              {crypto.name ? ` · ${crypto.name}` : ""}
            </AppText>
            {crypto.wallet_or_exchange ? (
              <AppText className="text-xs text-muted-foreground">{crypto.wallet_or_exchange}</AppText>
            ) : null}
          </View>
        </View>
        <StatusBadge tone={pnlPositive ? "success" : "destructive"}>{pnlPositive ? "Profit" : "Loss"}</StatusBadge>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Quantity" value={String(crypto.quantity)} />
        <Field label="Buy Price" value={formatINR(crypto.buy_price)} />
        <Field label="Current Price" value={formatINR(crypto.current_price)} />
        <Field label="Current Value" value={formatINR(currentValue)} />
      </View>
      <AppText className={pnlPositive ? "text-sm font-medium text-success" : "text-sm font-medium text-destructive"}>
        P&L {formatINR(pnl)}
      </AppText>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(crypto)} hitSlop={14}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(crypto.id)} hitSlop={14}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export const CryptoCard = memo(CryptoCardComponent);
