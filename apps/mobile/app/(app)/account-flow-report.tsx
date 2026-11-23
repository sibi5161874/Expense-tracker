import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactionsInRange, monthsAgo } from "@/hooks/useReportsData";
import { formatMonth } from "@repo/shared/utils";

const MONTHS_BACK = 3;

/**
 * Headless Account Flow Report Container
 */
export default function AccountFlowReportScreen() {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Account-wise Flow</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>
            Money in vs out per account over the last {MONTHS_BACK} months
          </Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        <View style={{ gap: 8 }}>
          {rows.map((row) => (
            <View
              key={row.name}
              style={{
                padding: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 6,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ gap: 2 }}>
                <Text style={{ fontWeight: "600" }}>{row.name}</Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                  In: ₹{row.in.toLocaleString("en-IN")} &bull; Out: ₹{row.out.toLocaleString("en-IN")}
                </Text>
              </View>
              <Text
                style={{
                  fontWeight: "bold",
                  color: row.net >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {row.net >= 0 ? "+" : ""}₹{row.net.toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
          {!isLoading && rows.length === 0 && (
            <Text style={{ color: "#6b7280" }}>No transaction flow recorded in this timeframe.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
