import { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useBudgetLimits } from "@/hooks/useBudgetLimits";

/**
 * Headless Config Container
 * Pure functional data container for Accounts, Categories, and Budget Limits management.
 */
export default function ConfigScreen() {
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState("Bank");
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: accounts, isLoading: accountsLoading, createAccount } = useAccounts();
  const { data: categories, isLoading: categoriesLoading, createCategory } = useCategories();
  const { data: budgetLimits, isLoading: budgetsLoading } = useBudgetLimits();

  async function handleAddAccount() {
    if (!newAccountName.trim()) return;
    await createAccount({
      name: newAccountName.trim(),
      type: newAccountType,
      opening_balance: 0,
      currency: "INR",
      is_active: true,
    });
    setNewAccountName("");
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    await createCategory({
      name: newCategoryName.trim(),
      type: "Expense",
    });
    setNewCategoryName("");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Configuration</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Manage accounts, expense categories, and monthly limits</Text>
        </View>

        {/* Accounts Config */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>Bank & Cash Accounts</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              placeholder="New Account Name (e.g. ICICI, Cash)"
              value={newAccountName}
              onChangeText={setNewAccountName}
              style={{ flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
            <Pressable
              onPress={handleAddAccount}
              style={{ paddingHorizontal: 16, backgroundColor: "#2563eb", borderRadius: 6, justifyContent: "center" }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "600" }}>+ Add</Text>
            </Pressable>
          </View>

          {accountsLoading && <ActivityIndicator />}
          <View style={{ gap: 4, marginTop: 4 }}>
            {accounts?.map((acc) => (
              <View
                key={acc.id}
                style={{ padding: 10, borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 4, flexDirection: "row", justifyContent: "space-between" }}
              >
                <Text style={{ fontWeight: "500" }}>{acc.name}</Text>
                <Text style={{ color: "#6b7280" }}>{acc.type} &bull; ₹{Number(acc.opening_balance || 0).toLocaleString("en-IN")}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Categories Config */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>Expense & Income Categories</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              placeholder="New Category Name (e.g. Groceries)"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              style={{ flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
            <Pressable
              onPress={handleAddCategory}
              style={{ paddingHorizontal: 16, backgroundColor: "#2563eb", borderRadius: 6, justifyContent: "center" }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "600" }}>+ Add</Text>
            </Pressable>
          </View>

          {categoriesLoading && <ActivityIndicator />}
          <View style={{ gap: 4, marginTop: 4 }}>
            {categories?.map((cat) => (
              <View
                key={cat.id}
                style={{ padding: 10, borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 4 }}
              >
                <Text style={{ fontWeight: "500" }}>{cat.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Budget Limits */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>Monthly Budget Limits</Text>
          {budgetsLoading && <ActivityIndicator />}
          <View style={{ gap: 4 }}>
            {budgetLimits?.map((b) => (
              <View
                key={b.id}
                style={{ padding: 10, borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 4, flexDirection: "row", justifyContent: "space-between" }}
              >
                <Text style={{ fontWeight: "500" }}>Category Limit</Text>
                <Text style={{ fontWeight: "bold" }}>₹{Number(b.monthly_limit).toLocaleString("en-IN")}</Text>
              </View>
            ))}
            {budgetLimits?.length === 0 && (
              <Text style={{ color: "#6b7280" }}>No custom budget limits set.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
