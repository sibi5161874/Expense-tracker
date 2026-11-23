import { useState } from "react";
import { View, Text, FlatList, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInvestmentLog } from "@/hooks/useInvestmentLog";
import { useAccounts } from "@/hooks/useAccounts";

/**
 * Headless Investments Container
 * Functional data container for logging and listing BUY/SELL/SIP trades.
 */
export default function InvestmentsScreen() {
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [action, setAction] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const { data: accounts } = useAccounts(true);
  const { data, isLoading, error, createInvestmentLog, deleteInvestmentLog } = useInvestmentLog({ page });

  async function handleCreate() {
    if (!symbol.trim() || !quantity || !price) {
      Alert.alert("Missing Fields", "Please provide symbol, quantity, and unit price.");
      return;
    }
    const defaultAccount = accounts?.[0];
    await createInvestmentLog({
      symbol: symbol.trim().toUpperCase(),
      action,
      quantity: Number(quantity),
      price: Number(price),
      date: new Date().toISOString().split("T")[0],
      linked_account_id: defaultAccount?.id || "",
      exchange: "NSE",
      asset_type: "Stock",
      fees: 0,
    });
    setSymbol("");
    setQuantity("");
    setPrice("");
    setShowAdd(false);
  }

  function handleDelete(id: string) {
    Alert.alert("Delete Trade", "Are you sure you want to remove this trade log?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteInvestmentLog(id) },
    ]);
  }

  const logs = data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>Investment Log</Text>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>{logs.length} trade records</Text>
          </View>
          <Pressable
            onPress={() => setShowAdd(!showAdd)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#2563eb", borderRadius: 6 }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>{showAdd ? "Cancel" : "+ Log Trade"}</Text>
          </Pressable>
        </View>

        {showAdd && (
          <View style={{ padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, gap: 8 }}>
            <Text style={{ fontWeight: "600" }}>New Trade</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setAction("BUY")}
                style={{ padding: 8, backgroundColor: action === "BUY" ? "#16a34a" : "#f3f4f6", borderRadius: 4 }}
              >
                <Text style={{ color: action === "BUY" ? "#ffffff" : "#000000" }}>BUY</Text>
              </Pressable>
              <Pressable
                onPress={() => setAction("SELL")}
                style={{ padding: 8, backgroundColor: action === "SELL" ? "#dc2626" : "#f3f4f6", borderRadius: 4 }}
              >
                <Text style={{ color: action === "SELL" ? "#ffffff" : "#000000" }}>SELL</Text>
              </Pressable>
            </View>
            <TextInput
              placeholder="Symbol (e.g. RELIANCE, NIFTYBEES)"
              value={symbol}
              onChangeText={setSymbol}
              autoCapitalize="characters"
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                placeholder="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                style={{ flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
              <TextInput
                placeholder="Price (₹)"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={{ flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>
            <Pressable
              onPress={handleCreate}
              style={{ padding: 10, backgroundColor: "#16a34a", borderRadius: 6, alignItems: "center" }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "600" }}>Save Trade</Text>
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
        data={logs}
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
              <Text style={{ fontWeight: "bold" }}>{item.symbol}</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>
                {item.date} &bull; {item.action} &bull; Qty: {item.quantity} @ ₹{item.price}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={{ fontWeight: "600" }}>₹{(item.quantity * item.price).toLocaleString("en-IN")}</Text>
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
