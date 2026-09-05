import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { formatINR } from "@repo/shared/utils/currency";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { CashFlowBars } from "@/components/dashboard/CashFlowBars";
import { ReportRow } from "@/components/reports/ReportRow";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useThemeColor } from "@/lib/colors";

export default function DividendIncomeReportScreen() {
  const { data: investments, isLoading, error } = useAllInvestmentLog();
  const primary = useThemeColor("primary");

  const { byHolding, byMonth, total } = useMemo(() => {
    const dividends = (investments ?? []).filter((i) => i.action === "DIVIDEND");
    const holdingTotals = new Map<string, number>();
    const monthTotals = new Map<string, number>();
    for (const d of dividends) {
      holdingTotals.set(d.symbol, (holdingTotals.get(d.symbol) ?? 0) + d.price);
      const month = d.date.slice(0, 7);
      monthTotals.set(month, (monthTotals.get(month) ?? 0) + d.price);
    }
    const byHolding = Array.from(holdingTotals, ([symbol, amount]) => ({ symbol, amount })).sort((a, b) => b.amount - a.amount);
    const byMonth = Array.from(monthTotals, ([month, income]) => ({
      month,
      label: new Date(`${month}-01T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      income,
      expense: 0,
    })).sort((a, b) => a.month.localeCompare(b.month));
    return { byHolding, byMonth, total: dividends.reduce((sum, d) => sum + d.price, 0) };
  }, [investments]);

  const sheets = [
    { name: "Dividend Income", rows: byHolding.map((h) => ({ Symbol: h.symbol, Total: h.amount })) },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader title="Dividend Income" description={`Total dividends received: ${formatINR(total)}.`} />
        {!isLoading && byHolding.length > 0 && (
          <ReportExportBar title="Dividend Income" description={`Total dividends received: ${formatINR(total)}.`} sheets={sheets} />
        )}
        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : (
          <>
            <View className="gap-3 rounded-2xl bg-card p-4">
              <AppText className="text-sm font-semibold">Dividend Income Over Time</AppText>
              {byMonth.length > 0 ? (
                <CashFlowBars data={byMonth} />
              ) : (
                <AppText className="py-8 text-center text-sm text-muted-foreground">No dividends recorded yet.</AppText>
              )}
            </View>
            <View className="gap-3">
              {byHolding.map((h) => (
                <ReportRow key={h.symbol} title={h.symbol} values={[{ label: "Total", value: h.amount, sign: "positive" }]} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
