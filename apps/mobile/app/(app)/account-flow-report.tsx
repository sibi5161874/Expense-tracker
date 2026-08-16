import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactionsInRange, monthsAgo } from "@/hooks/useReportsData";
import { formatMonth } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { ReportRow } from "@/components/reports/ReportRow";
import { ReportExportBar } from "@/components/reports/ReportExportBar";
import { useThemeColor } from "@/lib/colors";

const MONTHS_BACK = 3;

export default function AccountFlowReportScreen() {
  const from = monthsAgo(MONTHS_BACK - 1);
  const to = formatMonth(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)) + "-01";
  const { data: transactions, isLoading, error } = useTransactionsInRange(from, to);
  const primary = useThemeColor("primary");

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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-3 p-4 pb-32">
        <PageHeader title="Account-wise Flow" description={`Money in vs out per account over the last ${MONTHS_BACK} months.`} />
        <ReportExportBar
          title="Account-wise Flow"
          description={`Money in vs out per account over the last ${MONTHS_BACK} months.`}
          sheets={[{ name: "Account Flow", rows: rows.map((r) => ({ Account: r.name, In: r.in, Out: r.out, Net: r.net })) }]}
        />
        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : rows.length === 0 ? (
          <AppText className="py-8 text-center text-sm text-muted-foreground">No transactions in this period.</AppText>
        ) : (
          rows.map((r) => (
            <ReportRow
              key={r.name}
              title={r.name}
              values={[
                { label: "In", value: r.in, sign: "positive" },
                { label: "Out", value: r.out, sign: "negative" },
                { label: "Net", value: r.net },
              ]}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
