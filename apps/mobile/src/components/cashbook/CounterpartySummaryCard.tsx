import { View } from "react-native";
import { AlertTriangle, Users } from "lucide-react-native";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";

interface CounterpartySummaryCardProps {
  counterparty: string;
  totalGiven: number;
  totalReceived: number;
  netBalance: number;
  hasOverdue: boolean;
}

/** Mobile equivalent of CounterpartySummaryCard.tsx — flat rounded-2xl, overdue signaled by
 * the destructive-subtle background rather than a border (no border/shadow, per design spec). */
export function CounterpartySummaryCard({
  counterparty,
  totalGiven,
  totalReceived,
  netBalance,
  hasOverdue,
}: CounterpartySummaryCardProps) {
  const accentForeground = useThemeColor("accentForeground");

  const summaryText =
    netBalance > 0
      ? `${counterparty} owes you ${formatINR(netBalance)}`
      : netBalance < 0
        ? `You owe ${counterparty} ${formatINR(Math.abs(netBalance))}`
        : `Settled with ${counterparty}`;

  return (
    <View className={hasOverdue ? "gap-3 rounded-2xl bg-destructive-subtle p-4" : "gap-3 rounded-2xl bg-card p-4"}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <View className="size-8 items-center justify-center rounded-full bg-accent">
            <Users size={16} color={accentForeground} />
          </View>
          <AppText className="font-semibold">{counterparty}</AppText>
        </View>
        {hasOverdue && (
          <View className="flex-row items-center gap-1 rounded-full bg-destructive px-2 py-0.5">
            <AlertTriangle size={11} color="white" />
            <AppText className="text-xs font-medium text-white">Overdue</AppText>
          </View>
        )}
      </View>
      <AppText className="text-sm text-muted-foreground">{summaryText}</AppText>
      <View className="flex-row gap-6">
        <View className="gap-0.5">
          <AppText className="text-xs text-muted-foreground">Given</AppText>
          <AppText className="text-sm font-medium" style={{ fontVariant: ["tabular-nums"] }}>
            {formatINR(totalGiven)}
          </AppText>
        </View>
        <View className="gap-0.5">
          <AppText className="text-xs text-muted-foreground">Received</AppText>
          <AppText className="text-sm font-medium" style={{ fontVariant: ["tabular-nums"] }}>
            {formatINR(totalReceived)}
          </AppText>
        </View>
      </View>
    </View>
  );
}
