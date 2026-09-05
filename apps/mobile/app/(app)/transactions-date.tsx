import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react-native";
import { useTransactionsForDate } from "@/hooks/useTransactions";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { StatusBadge } from "@/components/common/Badge";
import { KpiGrid, type KpiStatItem } from "@/components/dashboard/KpiGrid";
import { transactionTypeTone } from "@/lib/badgeTones";
import { useThemeColor } from "@/lib/colors";

/** Reached from TransactionsCalendarView.tsx (flat route + `?date=` param, same convention
 * as stock-detail.tsx — see that file's header comment for why not a nested dynamic
 * segment). Mirrors apps/web/src/app/(app)/transactions/date/[date]/page.tsx. */
export default function TransactionsByDateScreen() {
  const { date: dateParam } = useLocalSearchParams<{ date: string }>();
  const date = dateParam ?? "";
  const { data: transactions, isLoading, error } = useTransactionsForDate(date);
  const primary = useThemeColor("primary");

  const summary = useMemo(() => {
    const totalIn = (transactions ?? []).reduce((sum, t) => (t.type === "Income" ? sum + t.amount : sum), 0);
    const totalOut = (transactions ?? []).reduce((sum, t) => (t.type === "Expense" ? sum + t.amount : sum), 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [transactions]);

  const kpis: KpiStatItem[] = [
    { label: "Total In", value: summary.totalIn, icon: TrendingUp, tone: "success" },
    { label: "Total Out", value: summary.totalOut, icon: TrendingDown, tone: "destructive" },
    { label: "Net", value: summary.net, icon: PiggyBank, tone: summary.net >= 0 ? "success" : "destructive" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader title={date} description="Transactions on this day." />

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : (transactions ?? []).length === 0 ? (
          <AppText className="text-sm text-muted-foreground">No transactions on this date.</AppText>
        ) : (
          <>
            <KpiGrid items={kpis} />
            <View className="gap-2">
              {(transactions ?? []).map((t) => (
                <View key={t.id} className="flex-row items-center justify-between gap-3 rounded-2xl bg-card p-4">
                  <View className="flex-1 flex-row items-center gap-3">
                    <StatusBadge tone={transactionTypeTone(t.type)}>{t.type}</StatusBadge>
                    <View className="flex-1">
                      <AppText className="text-sm font-medium" numberOfLines={1}>
                        {t.category?.name ?? "Uncategorized"}
                      </AppText>
                      <AppText className="text-xs text-muted-foreground" numberOfLines={1}>
                        {t.from_account?.name ?? ""}
                        {t.notes ? ` — ${t.notes}` : ""}
                      </AppText>
                    </View>
                  </View>
                  <AmountText
                    value={t.amount}
                    sign={t.type === "Income" ? "positive" : t.type === "Expense" ? "negative" : "neutral"}
                    className="text-sm font-semibold"
                  />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
