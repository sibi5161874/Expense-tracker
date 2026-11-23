import { useState } from "react";
import { View, Text, FlatList, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";

/**
 * Headless Transactions Container
 * Pure functional data container for transaction listing, pagination, and deletion/addition.
 */
export default function TransactionsScreen() {
  const [page, setPage] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"Income" | "Expense">("Expense");

  const { data: accounts } = useAccounts(true);
  const { data: categories } = useCategories();
  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    createTransaction,
    deleteTransaction,
  } = useTransactions({ page });

  async function handleCreate() {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert("Invalid Amount", "Please enter a valid numeric amount.");
      return;
    }
    const defaultAccount = accounts?.[0];
    const defaultCategory = categories?.[0];

    await createTransaction({
      amount: Number(amount),
      type,
      notes: description || undefined,
      date: new Date().toISOString().split("T")[0],
      from_account_id: defaultAccount?.id || "",
      category_id: defaultCategory?.id,
    });

    setAmount("");
    setDescription("");
    setShowAddForm(false);
  }

  function handleDelete(id: string) {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) },
    ]);
  }

  const transactions = data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>Transactions</Text>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>Total records: {transactions.length}</Text>
          </View>
          <Pressable
            onPress={() => setShowAddForm(!showAddForm)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#2563eb", borderRadius: 6 }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>{showAddForm ? "Cancel" : "+ Add"}</Text>
          </Pressable>
        </View>

        {/* Headless Add Transaction Form */}
        {showAddForm && (
          <View style={{ padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, gap: 8 }}>
            <Text style={{ fontWeight: "600" }}>New Transaction</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setType("Expense")}
                style={{
                  padding: 8,
                  backgroundColor: type === "Expense" ? "#dc2626" : "#f3f4f6",
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: type === "Expense" ? "#ffffff" : "#000000" }}>Expense</Text>
              </Pressable>
              <Pressable
                onPress={() => setType("Income")}
                style={{
                  padding: 8,
                  backgroundColor: type === "Income" ? "#16a34a" : "#f3f4f6",
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: type === "Income" ? "#ffffff" : "#000000" }}>Income</Text>
              </Pressable>
            </View>
            <TextInput
              placeholder="Amount (e.g. 500)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
            <TextInput
              placeholder="Notes / Description"
              value={description}
              onChangeText={setDescription}
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
            <Pressable
              onPress={handleCreate}
              style={{ padding: 10, backgroundColor: "#16a34a", borderRadius: 6, alignItems: "center" }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "600" }}>Save Transaction</Text>
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

      {/* Headless Transaction List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 80 }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text style={{ color: "#6b7280" }}>No transactions logged yet.</Text>
            </View>
          ) : null
        }
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
            <View style={{ gap: 2, flex: 1 }}>
              <Text style={{ fontWeight: "600" }}>{item.notes || "Uncategorized"}</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>
                {item.date} &bull; {item.type}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text
                style={{
                  fontWeight: "bold",
                  color: item.type === "Income" ? "#16a34a" : "#dc2626",
                }}
              >
                {item.type === "Income" ? "+" : "-"}₹{Number(item.amount).toLocaleString("en-IN")}
              </Text>
              <Pressable onPress={() => handleDelete(item.id)}>
                <Text style={{ fontSize: 12, color: "#ef4444" }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 }}>
            <Pressable
              disabled={page <= 0}
              onPress={() => setPage((p) => Math.max(0, p - 1))}
              style={{ opacity: page <= 0 ? 0.4 : 1 }}
            >
              <Text style={{ color: "#2563eb", fontWeight: "600" }}>&larr; Previous Page</Text>
            </Pressable>
            <Text style={{ color: "#6b7280" }}>Page {page + 1}</Text>
            <Pressable
              disabled={transactions.length < 20}
              onPress={() => setPage((p) => p + 1)}
              style={{ opacity: transactions.length < 20 ? 0.4 : 1 }}
            >
              <Text style={{ color: "#2563eb", fontWeight: "600" }}>Next Page &rarr;</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}
