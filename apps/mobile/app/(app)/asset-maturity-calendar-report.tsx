import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFixedDeposits, useLoanLiabilities } from "@/hooks/useAssets";
import { useInsurancePolicies } from "@/hooks/useInsurancePolicies";
import { calculateDaysLeft, calculateDaysUntilDue, calculateFixedDepositStatus, calculatePremiumStatus } from "@repo/shared/logic";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { ReportRow } from "@/components/reports/ReportRow";
import { ReportExportBar } from "@/components/reports/ReportExportBar";
import { fixedDepositStatusTone, premiumStatusTone } from "@/lib/badgeTones";
import { useThemeColor } from "@/lib/colors";

export default function AssetMaturityCalendarReportScreen() {
  const { data: fds, isLoading: fdsLoading, error: fdsError } = useFixedDeposits();
  const { data: liabilities, isLoading: liabilitiesLoading, error: liabilitiesError } = useLoanLiabilities();
  const { data: policies, isLoading: policiesLoading, error: policiesError } = useInsurancePolicies();
  const primary = useThemeColor("primary");

  const sortedFds = useMemo(
    () => (fds ? [...fds].filter((fd) => !fd.withdrawn).sort((a, b) => a.maturity_date.localeCompare(b.maturity_date)) : []),
    [fds]
  );
  const sortedPolicies = useMemo(
    () => (policies ? [...policies].sort((a, b) => a.premium_due_date.localeCompare(b.premium_due_date)) : []),
    [policies]
  );

  const isLoading = fdsLoading || liabilitiesLoading || policiesLoading;
  const error = fdsError || liabilitiesError || policiesError;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader
          title="Asset Maturity Calendar"
          description="FDs and insurance premiums by date. Loans show months remaining, not a specific due date."
        />
        <ReportExportBar
          title="Asset Maturity Calendar"
          description="FDs and insurance premiums by date. Loans show months remaining, not a specific due date."
          sheets={[
            {
              name: "FD Maturities",
              rows: sortedFds.map((fd) => ({
                Bank: fd.bank,
                "Maturity Date": fd.maturity_date,
                "Days Left": calculateDaysLeft(fd.maturity_date),
                "Maturity Value": fd.maturity_value,
              })),
            },
            {
              name: "Insurance Premiums",
              rows: sortedPolicies.map((p) => ({
                Insurer: p.insurer,
                "Policy Type": p.policy_type,
                "Premium Due Date": p.premium_due_date,
                "Days Until Due": calculateDaysUntilDue(p.premium_due_date),
                "Premium Amount": p.premium_amount,
              })),
            },
            {
              name: "Open Liabilities",
              rows: (liabilities ?? []).map((l) => ({
                Lender: l.lender,
                Outstanding: l.outstanding,
                "Months Left": l.months_left ?? "",
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
            <View className="gap-3">
              <AppText className="text-sm font-semibold">Fixed Deposit Maturities</AppText>
              {sortedFds.length === 0 ? (
                <AppText className="text-sm text-muted-foreground">No active fixed deposits.</AppText>
              ) : (
                sortedFds.map((fd) => (
                  <ReportRow
                    key={fd.id}
                    title={fd.bank}
                    subtitle={`Matures ${fd.maturity_date} · ${calculateDaysLeft(fd.maturity_date)}d left`}
                    badge={<StatusBadge tone={fixedDepositStatusTone(calculateFixedDepositStatus(fd.maturity_date, fd.withdrawn))}>{calculateFixedDepositStatus(fd.maturity_date, fd.withdrawn)}</StatusBadge>}
                    values={[{ label: "Value", value: fd.maturity_value }]}
                  />
                ))
              )}
            </View>

            <View className="gap-3">
              <AppText className="text-sm font-semibold">Insurance Premium Due Dates</AppText>
              {sortedPolicies.length === 0 ? (
                <AppText className="text-sm text-muted-foreground">No insurance policies found.</AppText>
              ) : (
                sortedPolicies.map((p) => (
                  <ReportRow
                    key={p.id}
                    title={p.insurer}
                    subtitle={`${p.policy_type} · due ${p.premium_due_date} · ${calculateDaysUntilDue(p.premium_due_date)}d`}
                    badge={<StatusBadge tone={premiumStatusTone(calculatePremiumStatus(p.premium_due_date))}>{calculatePremiumStatus(p.premium_due_date)}</StatusBadge>}
                    values={[{ label: "Premium", value: p.premium_amount }]}
                  />
                ))
              )}
            </View>

            <View className="gap-3">
              <AppText className="text-sm font-semibold">Open Liabilities</AppText>
              {(liabilities ?? []).length === 0 ? (
                <AppText className="text-sm text-muted-foreground">No open liabilities.</AppText>
              ) : (
                (liabilities ?? []).map((l) => (
                  <ReportRow
                    key={l.id}
                    title={l.lender}
                    subtitle={l.months_left != null ? `${l.months_left} months left` : undefined}
                    values={[{ label: "Outstanding", value: l.outstanding, sign: "negative" }]}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
