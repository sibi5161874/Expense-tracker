import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFixedDeposits,
  useGoldAssets,
  useLoanLiabilities,
  useEpfAccounts,
  useNpsAccounts,
  useSsyAccounts,
  useSgbHoldings,
  useUlipPolicies,
  useRealEstate,
  usePpfAccounts,
  useRecurringDeposits,
  useNscCertificates,
  useVehicles,
  useCryptoAssets,
} from "@/hooks/useAssets";

const ASSET_TYPES = [
  "Fixed Deposits",
  "Gold",
  "Loans & Liabilities",
  "EPF",
  "PPF",
  "NPS",
  "SGB",
  "Real Estate",
  "Crypto",
  "Recurring Deposits",
  "Vehicles",
  "SSY",
  "ULIP",
  "NSC",
] as const;

/**
 * Headless Assets Container
 * Pure functional data container for all 14 Indian asset classes and liabilities.
 */
export default function AssetsScreen() {
  const [selectedType, setSelectedType] = useState<typeof ASSET_TYPES[number]>("Fixed Deposits");

  const fd = useFixedDeposits();
  const gold = useGoldAssets();
  const loan = useLoanLiabilities();
  const epf = useEpfAccounts();
  const ppf = usePpfAccounts();
  const nps = useNpsAccounts();
  const sgb = useSgbHoldings();
  const re = useRealEstate();
  const crypto = useCryptoAssets();
  const rd = useRecurringDeposits();
  const veh = useVehicles();
  const ssy = useSsyAccounts();
  const ulip = useUlipPolicies();
  const nsc = useNscCertificates();

  function getCurrentData() {
    switch (selectedType) {
      case "Fixed Deposits": return { data: fd.data, hook: fd };
      case "Gold": return { data: gold.data, hook: gold };
      case "Loans & Liabilities": return { data: loan.data, hook: loan };
      case "EPF": return { data: epf.data, hook: epf };
      case "PPF": return { data: ppf.data, hook: ppf };
      case "NPS": return { data: nps.data, hook: nps };
      case "SGB": return { data: sgb.data, hook: sgb };
      case "Real Estate": return { data: re.data, hook: re };
      case "Crypto": return { data: crypto.data, hook: crypto };
      case "Recurring Deposits": return { data: rd.data, hook: rd };
      case "Vehicles": return { data: veh.data, hook: veh };
      case "SSY": return { data: ssy.data, hook: ssy };
      case "ULIP": return { data: ulip.data, hook: ulip };
      case "NSC": return { data: nsc.data, hook: nsc };
    }
  }

  const current = getCurrentData();
  const list = (current.data as any[]) ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>Assets & Liabilities</Text>
        <Text style={{ fontSize: 13, color: "#6b7280" }}>Select an asset class to inspect records</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {ASSET_TYPES.map((type) => (
            <Pressable
              key={type}
              onPress={() => setSelectedType(type)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: selectedType === type ? "#2563eb" : "#f3f4f6",
                borderRadius: 16,
              }}
            >
              <Text style={{ color: selectedType === type ? "#ffffff" : "#374151", fontSize: 13, fontWeight: "500" }}>
                {type}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {current.hook.isLoading && <ActivityIndicator style={{ marginTop: 24 }} />}

      <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 80 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>{selectedType} ({list.length})</Text>
        </View>

        {list.length === 0 && !current.hook.isLoading && (
          <Text style={{ color: "#6b7280", paddingVertical: 12 }}>No records found for {selectedType}.</Text>
        )}

        {list.map((item, idx) => (
          <View
            key={item.id || idx}
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
            <View style={{ gap: 2, flex: 1 }}>
              <Text style={{ fontWeight: "bold" }}>
                {item.bank_name || item.name || item.property_name || item.symbol || item.insurer || "Asset Record"}
              </Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>
                {item.account_number || item.policy_number || item.registration_number || ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={{ fontWeight: "bold" }}>
                ₹{Number(item.current_balance || item.current_value || item.principal_amount || item.amount || 0).toLocaleString("en-IN")}
              </Text>
              <Pressable
                onPress={() => {
                  Alert.alert("Delete", "Delete this asset record?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => (current.hook as any).deleteItem.mutateAsync(item.id) },
                  ]);
                }}
              >
                <Text style={{ fontSize: 12, color: "#ef4444" }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
