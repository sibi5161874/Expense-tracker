import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFixedDeposits, useLoanLiabilities } from "@/hooks/useAssets";
import { useInsurancePolicies } from "@/hooks/useInsurancePolicies";
import { calculateDaysLeft, calculateDaysUntilDue, calculateFixedDepositStatus, calculatePremiumStatus } from "@repo/shared/logic";

/**
 * Headless Asset Maturity Calendar Container
 */
export default function AssetMaturityCalendarReportScreen() {
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

  const isLoading = fdsLoading || liabilitiesLoading || policiesLoading;
  const error = fdsError || liabilitiesError || policiesError;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Asset Maturity Calendar</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Fixed deposit maturities and insurance premium due dates</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        {/* FDs */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>Fixed Deposit Maturities</Text>
          {sortedFds.map((fd) => (
            <View key={fd.id} style={{ padding: 8, borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 4, flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={{ fontWeight: "600" }}>{fd.bank}</Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                  Matures {fd.maturity_date} &bull; {calculateDaysLeft(fd.maturity_date)}d left ({calculateFixedDepositStatus(fd.maturity_date, fd.withdrawn)})
                </Text>
              </View>
              <Text style={{ fontWeight: "bold" }}>₹{Number(fd.maturity_value).toLocaleString("en-IN")}</Text>
            </View>
          ))}
          {!isLoading && sortedFds.length === 0 && <Text style={{ color: "#6b7280" }}>No active FDs.</Text>}
        </View>

        {/* Insurance */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>Insurance Premiums Due</Text>
          {sortedPolicies.map((p) => (
            <View key={p.id} style={{ padding: 8, borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 4, flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={{ fontWeight: "600" }}>{p.insurer}</Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                  Due {p.premium_due_date} &bull; {calculateDaysUntilDue(p.premium_due_date)}d ({calculatePremiumStatus(p.premium_due_date)})
                </Text>
              </View>
              <Text style={{ fontWeight: "bold" }}>₹{Number(p.premium_amount).toLocaleString("en-IN")}</Text>
            </View>
          ))}
          {!isLoading && sortedPolicies.length === 0 && <Text style={{ color: "#6b7280" }}>No policies found.</Text>}
        </View>

        {/* Liabilities */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>Open Liabilities</Text>
          {(liabilities ?? []).map((l) => (
            <View key={l.id} style={{ padding: 8, borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 4, flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={{ fontWeight: "600" }}>{l.lender}</Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>{l.months_left != null ? `${l.months_left} months left` : "-"}</Text>
              </View>
              <Text style={{ fontWeight: "bold", color: "#dc2626" }}>-₹{Number(l.outstanding).toLocaleString("en-IN")}</Text>
            </View>
          ))}
          {!isLoading && (liabilities ?? []).length === 0 && <Text style={{ color: "#6b7280" }}>No open liabilities.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
