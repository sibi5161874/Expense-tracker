import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Landmark, ShieldAlert, Wallet } from "lucide-react-native";
import { useNetWorth } from "@/hooks/useNetWorth";
import { formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Net Worth Statement Report Screen
 */
export default function NetWorthReportScreen() {
  const { theme } = useTheme();
  const { data: netWorth, isLoading, error } = useNetWorth();

  const totalAssets = (netWorth?.netWorth ?? 0) + (netWorth?.liabilitiesTotal ?? 0);
  const totalLiabilities = netWorth?.liabilitiesTotal ?? 0;
  const currentNetWorth = netWorth?.netWorth ?? 0;

  const sheets = useMemo(
    () => [
      {
        name: "Net Worth Statement",
        headers: ["Category", "Amount (INR)"],
        rows: [
          { Category: "Total Assets", "Amount (INR)": totalAssets },
          { Category: "Total Liabilities", "Amount (INR)": totalLiabilities },
          { Category: "Net Worth (Equity)", "Amount (INR)": currentNetWorth },
        ],
      },
    ],
    [totalAssets, totalLiabilities, currentNetWorth]
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
          title="Net Worth Statement"
          description="Assets, liabilities, and current equity"
        />

        <ReportExportBar
          title="Net Worth Statement"
          description="Comprehensive assets, liabilities, and equity summary"
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        <Card variant="elevated" className="p-5 gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Landmark size={20} color={theme.success} />
              <AppText className="text-sm text-muted-foreground">Total Assets</AppText>
            </View>
            <AmountText value={totalAssets} sign="positive" className="text-xl font-bold" />
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <ShieldAlert size={20} color={theme.destructive} />
              <AppText className="text-sm text-muted-foreground">Total Liabilities</AppText>
            </View>
            <AmountText value={totalLiabilities} sign="negative" className="text-xl font-bold" />
          </View>

          <View className="pt-3 border-t border-border/60 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Wallet size={20} color={theme.primary} />
              <AppText className="text-base font-bold text-foreground">Net Worth</AppText>
            </View>
            <AmountText value={currentNetWorth} className="text-2xl font-bold" />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
