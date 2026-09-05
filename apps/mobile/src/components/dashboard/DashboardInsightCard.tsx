import { View } from "react-native";
import { Coffee } from "lucide-react-native";
import { useRecentExpensesForInsight } from "@/hooks/useTransactions";
import { calculateCoffeeSpend, calculateLumpsumFutureValue, COFFEE_INSIGHT_MIN_AMOUNT } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";

const ASSUMED_ANNUAL_RETURN_PCT = 12;
const PROJECTION_YEARS = 5;

/** Mirrors apps/web/src/components/dashboard/DashboardInsightCard.tsx — a small "what if
 * you invested this instead" nudge, hidden entirely below COFFEE_INSIGHT_MIN_AMOUNT so it
 * doesn't nag over a single ₹40 chai. */
export function DashboardInsightCard() {
  const { data: expenses, isLoading } = useRecentExpensesForInsight();
  const warningForeground = useThemeColor("warningForeground");

  if (isLoading || !expenses) return null;

  const spend = calculateCoffeeSpend(expenses);
  if (spend < COFFEE_INSIGHT_MIN_AMOUNT) return null;

  const futureValue = calculateLumpsumFutureValue(spend, ASSUMED_ANNUAL_RETURN_PCT, PROJECTION_YEARS);

  return (
    <View className="flex-row items-start gap-3 rounded-2xl bg-warning-subtle p-4">
      <Coffee size={18} color={warningForeground} style={{ marginTop: 2 }} />
      <AppText className="flex-1 text-sm" style={{ color: warningForeground }}>
        You spent <AppText className="font-semibold" style={{ color: warningForeground }}>{formatINR(spend)}</AppText> on coffee, tea,
        and food delivery in the last 30 days. If invested at {ASSUMED_ANNUAL_RETURN_PCT}% for {PROJECTION_YEARS}{" "}
        years, this would be{" "}
        <AppText className="font-semibold" style={{ color: warningForeground }}>{formatINR(futureValue)}</AppText>.
      </AppText>
    </View>
  );
}
