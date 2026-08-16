import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { formatMonth } from "@repo/shared/utils";
import { formatINR } from "@repo/shared/utils/currency";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { CategoryBarList } from "@/components/dashboard/CategoryBarList";
import { ReportExportBar } from "@/components/reports/ReportExportBar";
import { useThemeColor } from "@/lib/colors";

export default function CategoryBreakdownReportScreen() {
  const currentMonth = formatMonth(new Date());
  const { categoryBreakdown, expense, isLoading, error } = useMonthlyOverview(currentMonth);
  const primary = useThemeColor("primary");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader title="Category Breakdown" description={`Where your money went in ${currentMonth}.`} />
        <ReportExportBar
          title="Category Breakdown"
          description={`Where your money went in ${currentMonth}.`}
          sheets={[
            {
              name: "Category Breakdown",
              rows: categoryBreakdown.map((c) => ({
                Category: c.name,
                Amount: c.value,
                "Share (%)": expense > 0 ? Number(((c.value / expense) * 100).toFixed(1)) : 0,
              })),
            },
          ]}
        />

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : (
          <>
            <View className="gap-3 rounded-2xl bg-card p-4">
              <AppText className="text-sm font-semibold">Expenses by Category</AppText>
              <CategoryBarList data={categoryBreakdown} />
            </View>

            <View className="gap-3">
              {categoryBreakdown.length === 0 ? (
                <AppText className="py-8 text-center text-sm text-muted-foreground">
                  No expenses recorded this month.
                </AppText>
              ) : (
                categoryBreakdown
                  .slice()
                  .sort((a, b) => b.value - a.value)
                  .map((c) => (
                    <View key={c.name} className="flex-row items-center justify-between rounded-2xl bg-card px-4 py-3">
                      <AppText className="text-sm font-medium">{c.name}</AppText>
                      <View className="items-end">
                        <AppText className="text-sm font-medium" style={{ fontVariant: ["tabular-nums"] }}>
                          {formatINR(c.value)}
                        </AppText>
                        <AppText className="text-xs text-muted-foreground">
                          {expense > 0 ? `${((c.value / expense) * 100).toFixed(1)}%` : "-"}
                        </AppText>
                      </View>
                    </View>
                  ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
