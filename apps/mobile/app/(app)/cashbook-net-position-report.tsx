import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCashbook } from "@/hooks/useCashbook";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { ReportRow } from "@/components/reports/ReportRow";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useThemeColor } from "@/lib/colors";

export default function CashbookNetPositionReportScreen() {
  const { summary, isLoading, error } = useCashbook();
  const primary = useThemeColor("primary");
  const rows = summary ? Object.entries(summary) : [];

  const sheets = [
    {
      name: "Cashbook Net Position",
      rows: rows.map(([counterparty, item]) => ({
        Counterparty: counterparty,
        Given: item.totalGiven,
        Received: item.totalReceived,
        Net: item.netBalance,
        Overdue: item.hasOverdue ? "Yes" : "No",
      })),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-3 p-4 pb-32">
        <PageHeader title="Cashbook Net Position" description="Who owes you, who you owe, and what's overdue." />
        {!isLoading && rows.length > 0 && (
          <ReportExportBar
            title="Cashbook Net Position"
            description="Who owes you, who you owe, and what's overdue."
            sheets={sheets}
          />
        )}
        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : rows.length === 0 ? (
          <AppText className="py-8 text-center text-sm text-muted-foreground">No cashbook entries found.</AppText>
        ) : (
          rows.map(([counterparty, item]) => (
            <ReportRow
              key={counterparty}
              title={counterparty}
              badge={
                item.hasOverdue ? (
                  <StatusBadge tone="destructive">Overdue</StatusBadge>
                ) : (
                  <StatusBadge tone="success">OK</StatusBadge>
                )
              }
              values={[
                { label: "Given", value: item.totalGiven },
                { label: "Received", value: item.totalReceived },
                { label: "Net", value: item.netBalance },
              ]}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
