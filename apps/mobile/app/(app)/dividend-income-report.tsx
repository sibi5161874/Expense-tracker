import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Coins } from "lucide-react-native";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Dividend Income Report Screen
 */
export default function DividendIncomeReportScreen() {
  const { theme } = useTheme();
  const { data: investments, isLoading, error } = useAllInvestmentLog();

  const { byHolding, total } = useMemo(() => {
    const dividends = (investments ?? []).filter((i) => i.action === "DIVIDEND");
    const holdingTotals = new Map<string, number>();
    for (const d of dividends) {
      holdingTotals.set(d.symbol, (holdingTotals.get(d.symbol) ?? 0) + d.price);
    }
    const byHolding = Array.from(holdingTotals, ([symbol, amount]) => ({ symbol, amount })).sort((a, b) => b.amount - a.amount);
    return { byHolding, total: dividends.reduce((sum, d) => sum + d.price, 0) };
  }, [investments]);

  const sheets = useMemo(
    () => [
      {
        name: "Dividend Income",
        headers: ["Symbol", "Total Dividends (INR)"],
        rows: [
          { Symbol: "Total Received", "Total Dividends (INR)": total },
          ...byHolding.map((h) => ({ Symbol: h.symbol, "Total Dividends (INR)": h.amount })),
        ],
      },
    ],
    [byHolding, total]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Dividend Income"
          description="Passive income from equity and mutual fund payouts"
        />

        <ReportExportBar
          title="Dividend Income Statement"
          description="Record of all dividend cash flows received"
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        {/* Hero Total Card */}
        <Card variant="elevated" className="p-5 gap-2">
          <View className="flex-row items-center gap-2">
            <Coins size={22} color={theme.success} />
            <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Dividends Received
            </AppText>
          </View>
          <AmountText value={total} sign="positive" className="text-3xl font-bold" />
        </Card>

        {/* Breakdown by Holding */}
        <View className="gap-2.5">
          <AppText className="text-sm font-bold text-foreground">
            Dividends by Symbol ({byHolding.length})
          </AppText>

          {byHolding.map((h) => (
            <Card key={h.symbol} variant="outlined" className="p-4 flex-row items-center justify-between">
              <AppText className="text-sm font-semibold text-foreground">{h.symbol}</AppText>
              <AmountText value={h.amount} sign="positive" className="text-base font-bold" />
            </Card>
          ))}

          {!isLoading && byHolding.length === 0 && (
            <Card variant="outlined" className="p-6 items-center justify-center">
              <AppText className="text-sm text-muted-foreground">No dividend transactions recorded yet.</AppText>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
