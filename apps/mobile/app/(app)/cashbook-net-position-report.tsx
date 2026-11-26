import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Users, AlertCircle } from "lucide-react-native";
import { useCashbook } from "@/hooks/useCashbook";
import { formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { StatusBadge } from "@/components/common/Badge";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Cashbook Net Position Report Screen
 */
export default function CashbookNetPositionReportScreen() {
  const { theme } = useTheme();
  const { summary, isLoading, error } = useCashbook();
  const rows = summary ? Object.entries(summary) : [];

  const sheets = useMemo(
    () => [
      {
        name: "Cashbook Net Positions",
        headers: ["Counterparty", "Total Given (INR)", "Total Received (INR)", "Net Balance (INR)", "Overdue"],
        rows: rows.map(([counterparty, item]) => ({
          Counterparty: counterparty,
          "Total Given (INR)": item.totalGiven,
          "Total Received (INR)": item.totalReceived,
          "Net Balance (INR)": item.netBalance,
          Overdue: item.hasOverdue ? "Yes" : "No",
        })),
      },
    ],
    [rows]
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
          title="Cashbook Net Position"
          description="Counterparty debt balances and overdue status"
        />

        <ReportExportBar
          title="Cashbook Net Position Statement"
          description="Lending, borrowing, and counterparty position reconciliation"
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        <View className="gap-2.5">
          {rows.map(([counterparty, item]) => (
            <Card key={counterparty} variant="outlined" className="p-4 gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Users size={18} color={theme.primary} />
                  <AppText className="text-sm font-semibold text-foreground">{counterparty}</AppText>
                </View>
                <View className="flex-row items-center gap-2">
                  {item.hasOverdue && <StatusBadge tone="destructive">OVERDUE</StatusBadge>}
                  <AmountText
                    value={item.netBalance}
                    sign={item.netBalance >= 0 ? "positive" : "negative"}
                    className="text-base font-bold"
                  />
                </View>
              </View>

              <View className="flex-row justify-between text-xs pt-1 border-t border-border/40">
                <AppText className="text-xs text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                  Given: {formatINR(item.totalGiven)}
                </AppText>
                <AppText className="text-xs text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                  Received: {formatINR(item.totalReceived)}
                </AppText>
              </View>
            </Card>
          ))}

          {!isLoading && rows.length === 0 && (
            <Card variant="outlined" className="p-6 items-center justify-center">
              <AppText className="text-sm text-muted-foreground">No cashbook entries recorded.</AppText>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
