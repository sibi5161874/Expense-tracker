import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeftRight, Landmark } from "lucide-react-native";
import { useTransactionsInRange, monthsAgo } from "@/hooks/useReportsData";
import { formatMonth, formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

const MONTHS_BACK = 3;

/**
 * Material 3 Account Flow Report Screen
 */
export default function AccountFlowReportScreen() {
  const { theme } = useTheme();
  const from = monthsAgo(MONTHS_BACK - 1);
  const to = formatMonth(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)) + "-01";
  const { data: transactions, isLoading, error } = useTransactionsInRange(from, to);

  const rows = useMemo(() => {
    const byAccount = new Map<string, { name: string; in: number; out: number }>();
    const ensure = (id: string, name: string) => {
      if (!byAccount.has(id)) byAccount.set(id, { name, in: 0, out: 0 });
      return byAccount.get(id)!;
    };
    for (const t of transactions ?? []) {
      if (t.type === "Income") {
        ensure(t.from_account_id, t.from_account?.name ?? "Unknown").in += t.amount;
      } else if (t.type === "Expense") {
        ensure(t.from_account_id, t.from_account?.name ?? "Unknown").out += t.amount;
      } else {
        ensure(t.from_account_id, t.from_account?.name ?? "Unknown").out += t.amount;
        if (t.to_account_id) ensure(t.to_account_id, t.to_account?.name ?? "Unknown").in += t.amount;
      }
    }
    return Array.from(byAccount.values())
      .map((a) => ({ ...a, net: a.in - a.out }))
      .sort((a, b) => b.in - a.in);
  }, [transactions]);

  const sheets = useMemo(
    () => [
      {
        name: "Account Flow",
        headers: ["Account", "Total In (INR)", "Total Out (INR)", "Net Flow (INR)"],
        rows: rows.map((r) => ({
          Account: r.name,
          "Total In (INR)": r.in,
          "Total Out (INR)": r.out,
          "Net Flow (INR)": r.net,
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
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Account-wise Flow"
          description={`Money in vs out per account over the last ${MONTHS_BACK} months`}
        />

        <ReportExportBar
          title="Account Flow Statement"
          description="Inflow, outflow, and net balance changes by account"
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        <View className="gap-2.5">
          {rows.map((row) => (
            <Card key={row.name} variant="outlined" className="p-4 gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Landmark size={18} color={theme.primary} />
                  <AppText className="text-sm font-semibold text-foreground">{row.name}</AppText>
                </View>
                <AmountText
                  value={row.net}
                  sign={row.net >= 0 ? "positive" : "negative"}
                  className="text-base font-bold"
                />
              </View>
              <View className="flex-row justify-between text-xs pt-1 border-t border-border/40">
                <View className="flex-row items-center gap-1">
                  <AppText className="text-xs text-muted-foreground">In:</AppText>
                  <AppText className="text-xs font-semibold text-success" style={{ fontVariant: ["tabular-nums"] }}>
                    {formatINR(row.in)}
                  </AppText>
                </View>
                <View className="flex-row items-center gap-1">
                  <AppText className="text-xs text-muted-foreground">Out:</AppText>
                  <AppText className="text-xs font-semibold text-destructive" style={{ fontVariant: ["tabular-nums"] }}>
                    {formatINR(row.out)}
                  </AppText>
                </View>
              </View>
            </Card>
          ))}

          {!isLoading && rows.length === 0 && (
            <Card variant="outlined" className="p-6 items-center justify-center">
              <AppText className="text-sm text-muted-foreground">No account flow data available.</AppText>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
