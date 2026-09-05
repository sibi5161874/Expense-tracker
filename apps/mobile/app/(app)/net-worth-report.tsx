import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNetWorth } from "@/hooks/useNetWorth";
import { formatINR } from "@repo/shared/utils/currency";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { CategoryBarList } from "@/components/dashboard/CategoryBarList";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { NetWorthSnapshotHistory } from "@/components/reports/NetWorthSnapshotHistory";
import { useThemeColor } from "@/lib/colors";

export default function NetWorthReportScreen() {
  const { data: breakdown, isLoading, error, unconvertedCurrencies, fxRatesStale, fxRatesFetchedAt } = useNetWorth();
  const warning = useThemeColor("warning");
  const primary = useThemeColor("primary");

  const chartData = breakdown
    ? [
        { name: "Cash & Bank", value: breakdown.cashAndBankTotal },
        { name: "Fixed Deposits", value: breakdown.fixedDepositsTotal },
        { name: "Gold", value: breakdown.goldTotal },
        { name: "EPF", value: breakdown.epfTotal },
        { name: "NPS", value: breakdown.npsTotal },
        { name: "SSY", value: breakdown.ssyTotal },
        { name: "SGB", value: breakdown.sgbTotal },
        { name: "ULIP", value: breakdown.ulipTotal },
        { name: "Real Estate", value: breakdown.realEstateTotal },
        { name: "PPF", value: breakdown.ppfTotal },
        { name: "Recurring Deposits", value: breakdown.recurringDepositsTotal },
        { name: "NSC", value: breakdown.nscTotal },
        { name: "Vehicles", value: breakdown.vehiclesTotal },
        { name: "Portfolio", value: breakdown.portfolioValue },
      ].filter((row) => row.value > 0)
    : [];

  const sheets = breakdown
    ? [
        {
          name: "Net Worth",
          rows: [
            ...chartData.map((d) => ({ Item: d.name, Amount: d.value })),
            { Item: "Liabilities", Amount: -breakdown.liabilitiesTotal },
            { Item: "Net Worth", Amount: breakdown.netWorth },
          ],
        },
      ]
    : [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader title="Net Worth Statement" description="Current snapshot — assets, portfolio, and liabilities." />
        {!isLoading && breakdown && (
          <ReportExportBar
            title="Net Worth Statement"
            description="Current snapshot — assets, portfolio, and liabilities."
            sheets={sheets}
          />
        )}
        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : breakdown ? (
          <>
            {unconvertedCurrencies.length > 0 && (
              <View className="gap-1 rounded-2xl bg-warning-subtle p-4">
                <AppText className="text-sm" style={{ color: warning }}>
                  ⚠ Couldn&apos;t fetch a live rate for {unconvertedCurrencies.join(", ")} — accounts in{" "}
                  {unconvertedCurrencies.length === 1 ? "that currency are" : "those currencies are"} excluded from
                  the totals below until rates are available.
                </AppText>
              </View>
            )}

            {fxRatesStale && fxRatesFetchedAt && (
              <AppText className="text-xs text-muted-foreground">
                Exchange rates as of{" "}
                {new Date(fxRatesFetchedAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                — the live rate provider is unreachable, so foreign-currency totals use the last successful fetch.
              </AppText>
            )}

            <View className="gap-1 rounded-2xl bg-card p-5">
              <AppText className="text-sm text-muted-foreground">Net Worth</AppText>
              <AppText
                className={breakdown.netWorth >= 0 ? "text-3xl font-semibold text-success" : "text-3xl font-semibold text-destructive"}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatINR(breakdown.netWorth)}
              </AppText>
            </View>

            {breakdown.liabilitiesTotal > 0 && (
              <View className="rounded-2xl bg-destructive-subtle p-4">
                <AppText className="text-xs text-muted-foreground">Liabilities</AppText>
                <AppText className="text-sm font-medium text-destructive">{formatINR(breakdown.liabilitiesTotal)}</AppText>
              </View>
            )}

            <View className="gap-3 rounded-2xl bg-card p-4">
              <AppText className="text-sm font-semibold">Breakdown</AppText>
              <CategoryBarList data={chartData} />
            </View>

            <NetWorthSnapshotHistory currentBreakdown={breakdown} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
