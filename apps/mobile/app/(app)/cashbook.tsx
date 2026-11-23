import { useState } from "react";
import { View, Text, FlatList, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCashbook } from "@/hooks/useCashbook";
import { useAccounts } from "@/hooks/useAccounts";

/**
 * Headless Cashbook Container
 * Pure functional data container for counterparty balances and debit/credit flow.
 */
export default function CashbookScreen() {
  const [showAdd, setShowAdd] = useState(false);
  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState("");
  const [flow, setFlow] = useState<"Gave" | "Received">("Gave");
  const [notes, setNotes] = useState("");

  const { data: accounts } = useAccounts(true);
  const { data: entries, isLoading, error, createCashbook, deleteCashbook } = useCashbook();

  async function handleCreate() {
    if (!counterparty.trim() || !amount) {
      Alert.alert("Missing Fields", "Please enter counterparty name and amount.");
      return;
    }
    const defaultAccount = accounts?.[0];
    await createCashbook({
      counterparty: counterparty.trim(),
      amount: Number(amount),
      flow,
      notes: notes || undefined,
      date: new Date().toISOString().split("T")[0],
      account_used_id: defaultAccount?.id,
    });
    setCounterparty("");
    setAmount("");
    setNotes("");
    setShowAdd(false);
  }

  function handleDelete(id: string) {
    Alert.alert("Delete Entry", "Are you sure you want to delete this cashbook record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteCashbook(id) },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>Cashbook</Text>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>{entries?.length ?? 0} active entries</Text>
          </View>
          <Pressable
            onPress={() => setShowAdd(!showAdd)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#2563eb", borderRadius: 6 }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>{showAdd ? "Cancel" : "+ Add Entry"}</Text>
          </Pressable>
        </View>

        {showAdd && (
          <View style={{ padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, gap: 8 }}>
            <Text style={{ fontWeight: "600" }}>New Cashbook Record</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setFlow("Gave")}
                style={{ padding: 8, backgroundColor: flow === "Gave" ? "#dc2626" : "#f3f4f6", borderRadius: 4 }}
              >
                <Text style={{ color: flow === "Gave" ? "#ffffff" : "#000000" }}>You Gave</Text>
              </Pressable>
              <Pressable
                onPress={() => setFlow("Received")}
                style={{ padding: 8, backgroundColor: flow === "Received" ? "#16a34a" : "#f3f4f6", borderRadius: 4 }}
              >
                <Text style={{ color: flow === "Received" ? "#ffffff" : "#000000" }}>You Got</Text>
              </Pressable>
            </View>
            <TextInput
              placeholder="Counterparty Name (e.g. Ramesh)"
              value={counterparty}
              onChangeText={setCounterparty}
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
            <TextInput
              placeholder="Amount (₹)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
            <TextInput
              placeholder="Notes / Purpose"
              value={notes}
              onChangeText={setNotes}
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
            <Pressable
              onPress={handleCreate}
              style={{ padding: 10, backgroundColor: "#16a34a", borderRadius: 6, alignItems: "center" }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "600" }}>Save Entry</Text>
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
        data={entries ?? []}
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
              <Text style={{ fontWeight: "bold" }}>{item.counterparty}</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>
                {item.date} &bull; {item.flow === "Received" ? "You Got" : "You Gave"} {item.notes ? `• ${item.notes}` : ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text
                style={{
                  fontWeight: "bold",
                  color: item.flow === "Received" ? "#16a34a" : "#dc2626",
                }}
              >
                {item.flow === "Received" ? "+" : "-"}₹{Number(item.amount).toLocaleString("en-IN")}
              </Text>
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
