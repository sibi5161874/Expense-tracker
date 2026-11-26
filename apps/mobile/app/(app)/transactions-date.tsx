import { useMemo } from "react";
import { View, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Calendar, ArrowDownRight, ArrowUpRight } from "lucide-react-native";
import { useTransactionsForDate } from "@/hooks/useTransactions";
import { formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Transactions By Date Screen
 */
export default function TransactionsByDateScreen() {
  const { theme } = useTheme();
  const { date: dateParam } = useLocalSearchParams<{ date: string }>();
  const date = dateParam ?? "";
  const { data: transactions, isLoading, error } = useTransactionsForDate(date);

  const summary = useMemo(() => {
    const totalIn = (transactions ?? []).reduce((sum, t) => (t.type === "Income" ? sum + t.amount : sum), 0);
    const totalOut = (transactions ?? []).reduce((sum, t) => (t.type === "Expense" ? sum + t.amount : sum), 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [transactions]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader showBack />
      <View className="px-4 pt-4 pb-2 gap-3">
        <PageHeader
          title={date || "Transactions on Date"}
          description="Day-level financial log and cash flow"
        />

        {/* Day Summary KPI Pill */}
        <Card variant="outlined" className="p-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <ArrowUpRight size={16} color={theme.success} />
            <AppText className="text-xs text-muted-foreground">In:</AppText>
            <AppText className="text-xs font-semibold text-success" style={{ fontVariant: ["tabular-nums"] }}>
              {formatINR(summary.totalIn)}
            </AppText>
          </View>
          <View className="flex-row items-center gap-1.5">
            <ArrowDownRight size={16} color={theme.destructive} />
            <AppText className="text-xs text-muted-foreground">Out:</AppText>
            <AppText className="text-xs font-semibold text-destructive" style={{ fontVariant: ["tabular-nums"] }}>
              {formatINR(summary.totalOut)}
            </AppText>
          </View>
          <View className="flex-row items-center gap-1.5">
            <AppText className="text-xs font-medium text-foreground">Net:</AppText>
            <AmountText value={summary.net} className="text-xs font-bold" />
          </View>
        </Card>
      </View>

      {isLoading && <ActivityIndicator color={theme.primary} style={{ marginTop: 24 }} />}
      {error && (
        <Card variant="outlined" className="mx-4 my-2 p-3 border-destructive/40 bg-destructive/10">
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        </Card>
      )}

      <FlatList
        data={transactions ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <Card variant="outlined" className="p-6 items-center justify-center">
              <AppText className="text-sm text-muted-foreground">
                No transactions recorded on this date.
              </AppText>
            </Card>
          ) : null
        }
        renderItem={({ item }) => (
          <Card variant="outlined" className="p-3.5 flex-row items-center justify-between">
            <View className="gap-0.5 flex-1 pr-3">
              <AppText className="text-sm font-semibold text-foreground" numberOfLines={1}>
                {item.notes || "Uncategorized"}
              </AppText>
              <AppText className="text-xs text-muted-foreground">
                {item.type}
              </AppText>
            </View>
            <AmountText
              value={item.amount}
              sign={item.type === "Income" ? "positive" : "negative"}
              className="text-base font-bold"
            />
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
