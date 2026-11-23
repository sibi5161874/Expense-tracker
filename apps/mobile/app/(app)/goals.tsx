import { useState } from "react";
import { View, Text, FlatList, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGoals } from "@/hooks/useGoals";

/**
 * Headless Goals Container
 * Pure functional data container for savings goals and progress tracking.
 */
export default function GoalsScreen() {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const { data: goals, isLoading, error, createGoal, deleteGoal } = useGoals();

  async function handleCreate() {
    if (!name.trim() || !targetAmount) {
      Alert.alert("Missing Fields", "Please enter goal name and target amount.");
      return;
    }
    await createGoal({
      goal_name: name.trim(),
      category: "Savings",
      target_amount: Number(targetAmount),
      saved_amount: savedAmount ? Number(savedAmount) : 0,
      target_date: targetDate || new Date().toISOString().split("T")[0],
      priority: "Medium",
    });
    setName("");
    setTargetAmount("");
    setSavedAmount("");
    setTargetDate("");
    setShowAdd(false);
  }

  function handleDelete(id: string) {
    Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteGoal(id) },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>Financial Goals</Text>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>{goals?.length ?? 0} goals tracked</Text>
          </View>
          <Pressable
            onPress={() => setShowAdd(!showAdd)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#2563eb", borderRadius: 6 }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>{showAdd ? "Cancel" : "+ Add Goal"}</Text>
          </Pressable>
        </View>

        {showAdd && (
          <View style={{ padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, gap: 8 }}>
            <Text style={{ fontWeight: "600" }}>New Goal</Text>
            <TextInput
              placeholder="Goal Name (e.g. Emergency Fund, Car)"
              value={name}
              onChangeText={setName}
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                placeholder="Target Amount (₹)"
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="numeric"
                style={{ flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
              <TextInput
                placeholder="Already Saved (₹)"
                value={savedAmount}
                onChangeText={setSavedAmount}
                keyboardType="numeric"
                style={{ flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>
            <TextInput
              placeholder="Target Date (YYYY-MM-DD)"
              value={targetDate}
              onChangeText={setTargetDate}
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
            <Pressable
              onPress={handleCreate}
              style={{ padding: 10, backgroundColor: "#16a34a", borderRadius: 6, alignItems: "center" }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "600" }}>Save Goal</Text>
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
        data={goals ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 80 }}
        renderItem={({ item }) => {
          const pct = Math.min(100, Math.round((item.saved_amount / (item.target_amount || 1)) * 100));
          return (
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
                <Text style={{ fontWeight: "bold" }}>{item.goal_name}</Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                  Saved: ₹{item.saved_amount.toLocaleString("en-IN")} / ₹{item.target_amount.toLocaleString("en-IN")} ({pct}%)
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={{ fontWeight: "bold", color: pct >= 100 ? "#16a34a" : "#2563eb" }}>{pct}%</Text>
                <Pressable onPress={() => handleDelete(item.id)}>
                  <Text style={{ fontSize: 12, color: "#ef4444" }}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
