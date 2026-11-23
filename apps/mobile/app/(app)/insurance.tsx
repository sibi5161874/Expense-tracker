import { useState } from "react";
import { View, Text, FlatList, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInsurancePolicies } from "@/hooks/useInsurancePolicies";

/**
 * Headless Insurance Container
 * Pure functional data container for insurance policies (Term, Health, Motor, Other).
 */
export default function InsuranceScreen() {
  const [showAdd, setShowAdd] = useState(false);
  const [insurer, setInsurer] = useState("");
  const [policyType, setPolicyType] = useState<"Term" | "Health" | "Motor" | "Other">("Term");
  const [policyNumber, setPolicyNumber] = useState("");
  const [coverageAmount, setCoverageAmount] = useState("");
  const [premiumAmount, setPremiumAmount] = useState("");
  const [premiumDueDate, setPremiumDueDate] = useState("");

  const { data: policies, isLoading, error, createInsurancePolicy, deleteInsurancePolicy } = useInsurancePolicies();

  async function handleCreate() {
    if (!insurer.trim() || !policyNumber.trim() || !coverageAmount || !premiumAmount) {
      Alert.alert("Missing Fields", "Please complete all policy details.");
      return;
    }
    await createInsurancePolicy({
      insurer: insurer.trim(),
      policy_type: policyType,
      policy_number: policyNumber.trim(),
      coverage_amount: Number(coverageAmount),
      premium_amount: Number(premiumAmount),
      premium_due_date: premiumDueDate || new Date().toISOString().split("T")[0],
    });
    setInsurer("");
    setPolicyNumber("");
    setCoverageAmount("");
    setPremiumAmount("");
    setPremiumDueDate("");
    setShowAdd(false);
  }

  function handleDelete(id: string) {
    Alert.alert("Delete Policy", "Are you sure you want to delete this insurance policy?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteInsurancePolicy(id) },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>Insurance</Text>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>{policies?.length ?? 0} active policies</Text>
          </View>
          <Pressable
            onPress={() => setShowAdd(!showAdd)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#2563eb", borderRadius: 6 }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>{showAdd ? "Cancel" : "+ Add Policy"}</Text>
          </Pressable>
        </View>

        {showAdd && (
          <View style={{ padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, gap: 8 }}>
            <Text style={{ fontWeight: "600" }}>New Insurance Policy</Text>
            <TextInput
              placeholder="Insurer Name (e.g. HDFC Life, ICICI Lombard)"
              value={insurer}
              onChangeText={setInsurer}
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
            <TextInput
              placeholder="Policy Number"
              value={policyNumber}
              onChangeText={setPolicyNumber}
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["Term", "Health", "Motor", "Other"] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setPolicyType(t)}
                  style={{
                    flex: 1,
                    padding: 8,
                    alignItems: "center",
                    backgroundColor: policyType === t ? "#2563eb" : "#f3f4f6",
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ color: policyType === t ? "#ffffff" : "#000000" }}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                placeholder="Coverage (₹)"
                value={coverageAmount}
                onChangeText={setCoverageAmount}
                keyboardType="numeric"
                style={{ flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
              <TextInput
                placeholder="Premium (₹)"
                value={premiumAmount}
                onChangeText={setPremiumAmount}
                keyboardType="numeric"
                style={{ flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>
            <TextInput
              placeholder="Premium Due Date (YYYY-MM-DD)"
              value={premiumDueDate}
              onChangeText={setPremiumDueDate}
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
            <Pressable
              onPress={handleCreate}
              style={{ padding: 10, backgroundColor: "#16a34a", borderRadius: 6, alignItems: "center" }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "600" }}>Save Policy</Text>
            </Pressable>
          </View>
        )}
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: 24 }} />}
      {error && (
        <View style={{ margin: 16, padding: 12, backgroundColor: "#fee2e2", borderRadius: 6 }}>
          <Text style={{ color: "#b91c1c" }}>{error.message}</Text>
        </View>
      )}

      <FlatList
        data={policies ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View
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
              <Text style={{ fontWeight: "bold" }}>{item.insurer} ({item.policy_type})</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>
                #{item.policy_number} &bull; Due: {item.premium_due_date}
              </Text>
              <Text style={{ fontSize: 12, color: "#16a34a" }}>
                Cover: ₹{Number(item.coverage_amount).toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={{ fontWeight: "bold" }}>₹{Number(item.premium_amount).toLocaleString("en-IN")}</Text>
              <Pressable onPress={() => handleDelete(item.id)}>
                <Text style={{ fontSize: 12, color: "#ef4444" }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
