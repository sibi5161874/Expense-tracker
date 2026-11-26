import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trophy, TrendingDown } from "lucide-react-native";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { groupInvestmentsBySymbol } from "@repo/shared/logic";
import { PageHeader } from "@/components/common/PageHeader";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Best/Worst Performers Report Screen
 */
export default function BestWorstPerformersReportScreen() {
  const { theme } = useTheme();
  const { data: investments, isLoading, error } = useAllInvestmentLog();

  const holdings = useMemo(() => {
    const grouped = investments ? groupInvestmentsBySymbol(investments) : [];
    return [...grouped]
      .sort((a, b) => b.returnPct - a.returnPct)
      .map((h) => ({
        symbol: h.symbol,
        returnPct: Number((h.returnPct * 100).toFixed(2)),
        currentValue: h.currentValue,
        unrealisedPnl: h.unrealisedPnl,
      }));
  }, [investments]);

  const sheets = useMemo(
    () => [
      {
        name: "Performance Rankings",
        headers: ["Symbol", "Return (%)", "Unrealized P&L (INR)", "Current Value (INR)"],
        rows: holdings.map((h) => ({
          Symbol: h.symbol,
          "Return (%)": `${h.returnPct}%`,
          "Unrealized P&L (INR)": h.unrealisedPnl,
          "Current Value (INR)": h.currentValue,
        })),
      },
    ],
    [holdings]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader showBack />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Best/Worst Performers"
          description="Holdings ranked by unrealised return percentage"
        />

        <ReportExportBar
          title="Holdings Performance Ranking"
          description="Ranked overview of asset returns"
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        <View className="gap-2.5">
          {holdings.map((h, i) => {
            const isTop = i < 3 && h.returnPct > 0;
            return (
              <Card key={h.symbol} variant="outlined" className="p-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className={`size-8 rounded-full items-center justify-center ${isTop ? "bg-amber-500/15" : "bg-surface-container-highest"}`}>
                    {isTop ? (
                      <Trophy size={16} color="#f59e0b" />
                    ) : (
                      <AppText className="text-xs font-semibold text-muted-foreground">{i + 1}</AppText>
                    )}
                  </View>
                  <AppText className="text-sm font-semibold text-foreground">{h.symbol}</AppText>
                </View>

                <AppText
                  className={`text-base font-bold ${
                    h.returnPct >= 0 ? "text-success" : "text-destructive"
                  }`}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {h.returnPct >= 0 ? "+" : ""}{h.returnPct}%
                </AppText>
              </Card>
            );
          })}

          {!isLoading && holdings.length === 0 && (
            <Card variant="outlined" className="p-6 items-center justify-center">
              <AppText className="text-sm text-muted-foreground">No holdings found to rank.</AppText>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
