import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, ShieldCheck, AlertCircle } from "lucide-react-native";
import { useFixedDeposits, useLoanLiabilities } from "@/hooks/useAssets";
import { useInsurancePolicies } from "@/hooks/useInsurancePolicies";
import {
  calculateDaysLeft,
  calculateDaysUntilDue,
  calculateFixedDepositStatus,
  calculatePremiumStatus,
} from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Asset Maturity Calendar Report Screen
 */
export default function AssetMaturityCalendarReportScreen() {
  const { theme } = useTheme();
  const { data: fds, isLoading: fdsLoading, error: fdsError } = useFixedDeposits();
  const { data: liabilities, isLoading: liabilitiesLoading, error: liabilitiesError } = useLoanLiabilities();
  const { data: policies, isLoading: policiesLoading, error: policiesError } = useInsurancePolicies();

  const sortedFds = useMemo(
    () => (fds ? [...fds].filter((fd) => !fd.withdrawn).sort((a, b) => a.maturity_date.localeCompare(b.maturity_date)) : []),
    [fds]
  );
  const sortedPolicies = useMemo(
    () => (policies ? [...policies].sort((a, b) => a.premium_due_date.localeCompare(b.premium_due_date)) : []),
    [policies]
  );

  const sheets = useMemo(
    () => [
      {
        name: "Fixed Deposit Maturities",
        headers: ["Bank", "Maturity Date", "Maturity Value (INR)", "Status"],
        rows: sortedFds.map((fd) => ({
          Bank: fd.bank,
          "Maturity Date": fd.maturity_date,
          "Maturity Value (INR)": fd.maturity_value,
          Status: calculateFixedDepositStatus(fd.maturity_date, fd.withdrawn),
        })),
      },
      {
        name: "Insurance Premiums",
        headers: ["Insurer", "Due Date", "Premium Amount (INR)", "Status"],
        rows: sortedPolicies.map((p) => ({
          Insurer: p.insurer,
          "Due Date": p.premium_due_date,
          "Premium Amount (INR)": p.premium_amount,
          Status: calculatePremiumStatus(p.premium_due_date),
        })),
      },
    ],
    [sortedFds, sortedPolicies]
  );

  const isLoading = fdsLoading || liabilitiesLoading || policiesLoading;
  const error = fdsError || liabilitiesError || policiesError;

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
          title="Maturity Calendar"
          description="Fixed deposit maturities and insurance premium due dates"
        />

        <ReportExportBar
          title="Asset Maturity Calendar"
          description="Timeline of upcoming liquidity events and policy premiums"
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        {/* FDs */}
        <Card variant="elevated" className="p-5 gap-3.5">
          <View className="flex-row items-center gap-2">
            <Calendar size={20} color={theme.primary} />
            <AppText className="text-base font-bold text-foreground">Fixed Deposit Maturities</AppText>
          </View>

          <View className="gap-2.5">
            {sortedFds.map((fd) => {
              const status = calculateFixedDepositStatus(fd.maturity_date, fd.withdrawn);
              return (
                <View key={fd.id} className="p-3.5 rounded-xl border border-border/60 bg-surface-container-highest/40 gap-1.5">
                  <View className="flex-row items-center justify-between">
                    <AppText className="text-sm font-semibold text-foreground">{fd.bank}</AppText>
                    <StatusBadge tone={status === "Matured" ? "warning" : "info"}>
                      {status.toUpperCase()}
                    </StatusBadge>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <AppText className="text-xs text-muted-foreground">
                      Matures {fd.maturity_date} • {calculateDaysLeft(fd.maturity_date)}d left
                    </AppText>
                    <AppText className="text-sm font-bold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                      {formatINR(Number(fd.maturity_value))}
                    </AppText>
                  </View>
                </View>
              );
            })}

            {!isLoading && sortedFds.length === 0 && (
              <AppText className="text-sm text-muted-foreground">No active fixed deposits found.</AppText>
            )}
          </View>
        </Card>

        {/* Insurance Premiums */}
        <Card variant="outlined" className="p-5 gap-3.5">
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={20} color={theme.primary} />
            <AppText className="text-base font-bold text-foreground">Insurance Premiums Due</AppText>
          </View>

          <View className="gap-2.5">
            {sortedPolicies.map((p) => {
              const status = calculatePremiumStatus(p.premium_due_date);
              return (
                <View key={p.id} className="p-3.5 rounded-xl border border-border/60 bg-surface-container-highest/40 gap-1.5">
                  <View className="flex-row items-center justify-between">
                    <AppText className="text-sm font-semibold text-foreground">{p.insurer}</AppText>
                    <StatusBadge tone={status === "Overdue" ? "destructive" : "info"}>
                      {status.toUpperCase()}
                    </StatusBadge>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <AppText className="text-xs text-muted-foreground">
                      Due {p.premium_due_date} • {calculateDaysUntilDue(p.premium_due_date)}d
                    </AppText>
                    <AppText className="text-sm font-bold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                      {formatINR(Number(p.premium_amount))}
                    </AppText>
                  </View>
                </View>
              );
            })}

            {!isLoading && sortedPolicies.length === 0 && (
              <AppText className="text-sm text-muted-foreground">No insurance policies found.</AppText>
            )}
          </View>
        </Card>

        {/* Liabilities */}
        <Card variant="outlined" className="p-5 gap-3.5">
          <View className="flex-row items-center gap-2">
            <AlertCircle size={20} color={theme.destructive} />
            <AppText className="text-base font-bold text-foreground">Open Loan Liabilities</AppText>
          </View>

          <View className="gap-2.5">
            {(liabilities ?? []).map((l) => (
              <View key={l.id} className="p-3.5 rounded-xl border border-border/60 bg-surface-container-highest/40 flex-row items-center justify-between">
                <View>
                  <AppText className="text-sm font-semibold text-foreground">{l.lender}</AppText>
                  <AppText className="text-xs text-muted-foreground">
                    {l.months_left != null ? `${l.months_left} months remaining` : "Active Loan"}
                  </AppText>
                </View>
                <AppText className="text-sm font-bold text-destructive" style={{ fontVariant: ["tabular-nums"] }}>
                  {formatINR(Number(l.outstanding))}
                </AppText>
              </View>
            ))}

            {!isLoading && (!liabilities || liabilities.length === 0) && (
              <AppText className="text-sm text-muted-foreground">No active loan liabilities.</AppText>
            )}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
