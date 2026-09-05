import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTransactionsForMonth } from "@/hooks/useTransactions";
import { groupTransactionsByDate, buildCalendarGrid } from "@repo/shared/logic";
import { formatMonth } from "@repo/shared/utils";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function shiftMonth(month: string, delta: number): string {
  const [year, mo] = month.split("-").map(Number) as [number, number];
  const shifted = new Date(Date.UTC(year, mo - 1 + delta, 1));
  return formatMonth(shifted);
}

function monthLabel(month: string): string {
  const [year, mo] = month.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(year, mo - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Mirrors apps/web/src/components/transactions/TransactionsCalendarView.tsx. */
export function TransactionsCalendarView() {
  const [month, setMonth] = useState(() => formatMonth(new Date()));
  const { data: transactions, isLoading, error } = useTransactionsForMonth(month);
  const mutedForeground = useThemeColor("mutedForeground");
  const success = useThemeColor("success");
  const destructive = useThemeColor("destructive");
  const info = useThemeColor("info");

  const cells = useMemo(() => {
    const byDate = groupTransactionsByDate(transactions ?? []);
    return buildCalendarGrid(month, byDate);
  }, [transactions, month]);

  return (
    <View className="gap-4 rounded-2xl bg-card p-4">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => setMonth((m) => shiftMonth(m, -1))} hitSlop={14}>
          <ChevronLeft size={18} color={mutedForeground} />
        </Pressable>
        <AppText className="text-sm font-semibold">{monthLabel(month)}</AppText>
        <Pressable onPress={() => setMonth((m) => shiftMonth(m, 1))} hitSlop={14}>
          <ChevronRight size={18} color={mutedForeground} />
        </Pressable>
      </View>

      {isLoading ? (
        <AppText className="py-4 text-center text-sm text-muted-foreground">Loading transactions…</AppText>
      ) : error ? (
        <AppText className="text-sm text-destructive">{error.message}</AppText>
      ) : (
        <>
          <View className="flex-row flex-wrap">
            {WEEKDAY_LABELS.map((label, i) => (
              <View key={`${label}-${i}`} style={{ width: "14.28%" }} className="items-center py-1">
                <AppText className="text-xs font-semibold uppercase text-muted-foreground">{label}</AppText>
              </View>
            ))}
            {cells.map((cell, i) =>
              cell.date === null ? (
                <View key={`blank-${i}`} style={{ width: "14.28%" }} className="aspect-square" />
              ) : (
                <Pressable
                  key={cell.date}
                  onPress={() => router.push({ pathname: "/(app)/transactions-date", params: { date: cell.date } })}
                  style={{ width: "14.28%" }}
                  className="aspect-square items-center justify-center gap-1 active:opacity-70"
                >
                  <View
                    className={
                      cell.hasIncome || cell.hasExpense || cell.hasTransfer
                        ? "size-8 items-center justify-center rounded-xl bg-muted"
                        : "size-8 items-center justify-center rounded-xl"
                    }
                  >
                    <AppText className="text-sm" style={{ fontVariant: ["tabular-nums"] }}>
                      {Number(cell.date.slice(-2))}
                    </AppText>
                  </View>
                  <View className="flex-row gap-0.5">
                    {cell.hasIncome && <View className="size-1.5 rounded-full" style={{ backgroundColor: success }} />}
                    {cell.hasExpense && <View className="size-1.5 rounded-full" style={{ backgroundColor: destructive }} />}
                    {cell.hasTransfer && <View className="size-1.5 rounded-full" style={{ backgroundColor: info }} />}
                  </View>
                </Pressable>
              )
            )}
          </View>

          <View className="flex-row gap-4">
            <View className="flex-row items-center gap-1.5">
              <View className="size-1.5 rounded-full" style={{ backgroundColor: success }} />
              <AppText className="text-xs text-muted-foreground">Income</AppText>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="size-1.5 rounded-full" style={{ backgroundColor: destructive }} />
              <AppText className="text-xs text-muted-foreground">Expense</AppText>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="size-1.5 rounded-full" style={{ backgroundColor: info }} />
              <AppText className="text-xs text-muted-foreground">Transfer</AppText>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
