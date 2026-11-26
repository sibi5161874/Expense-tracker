import { useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Landmark, Tag, PiggyBank } from "lucide-react-native";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useBudgetLimits } from "@/hooks/useBudgetLimits";

import { AppText } from "@/components/common/AppText";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import { AmountText } from "@/components/common/AmountText";
import { useTheme } from "@/theme/ThemeProvider";

export default function ConfigScreen() {
  const { theme } = useTheme();
  const [newAccountName, setNewAccountName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: accounts, createAccount } = useAccounts();
  const { data: categories, createCategory } = useCategories();
  const { data: budgetLimits } = useBudgetLimits();

  const accountList = accounts ?? [];
  const categoryList = categories ?? [];
  const budgetList = budgetLimits ?? [];

  async function handleAddAccount() {
    if (!newAccountName.trim()) return;
    await createAccount({
      name: newAccountName.trim(),
      type: "Bank",
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
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader showBack />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 96,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="gap-1">
          <AppText className="text-2xl font-bold tracking-tight text-foreground">
            Configuration
          </AppText>
          <AppText className="text-xs text-muted-foreground">
            Manage bank accounts, categories, and monthly budget caps
          </AppText>
        </View>

        {/* Section 1: Accounts */}
        <Card variant="outlined" className="gap-3.5">
          <View className="flex-row items-center gap-2">
            <Landmark size={18} color={theme.primary} />
            <AppText className="text-base font-bold text-foreground">
              Bank & Cash Accounts
            </AppText>
          </View>

          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <TextField
                label="New Account"
                placeholder="e.g. HDFC Salary, Cash..."
                value={newAccountName}
                onChangeText={setNewAccountName}
              />
            </View>
            <Button variant="primary" onPress={handleAddAccount} className="mt-5">
              Add
            </Button>
          </View>

          <View className="gap-2 pt-1">
            {accountList.map((a) => (
              <View
                key={a.id}
                className="flex-row items-center justify-between rounded-xl px-3.5 py-2.5"
                style={{ backgroundColor: theme.surfaceContainer || theme.card }}
              >
                <AppText className="text-sm font-medium text-foreground">{a.name}</AppText>
                <AppText className="text-xs text-muted-foreground">{a.type}</AppText>
              </View>
            ))}
          </View>
        </Card>

        {/* Section 2: Categories */}
        <Card variant="outlined" className="gap-3.5">
          <View className="flex-row items-center gap-2">
            <Tag size={18} color={theme.primary} />
            <AppText className="text-base font-bold text-foreground">
              Expense Categories
            </AppText>
          </View>

          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <TextField
                label="New Category"
                placeholder="e.g. Groceries, Entertainment..."
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
            </View>
            <Button variant="primary" onPress={handleAddCategory} className="mt-5">
              Add
            </Button>
          </View>

          <View className="flex-row flex-wrap gap-2 pt-1">
            {categoryList.map((c) => (
              <View
                key={c.id}
                className="rounded-full px-3 py-1 border"
                style={{
                  borderColor: theme.outlineVariant ? `${theme.outlineVariant}55` : theme.border,
                  backgroundColor: theme.surfaceContainer || theme.card,
                }}
              >
                <AppText className="text-xs font-medium text-foreground">{c.name}</AppText>
              </View>
            ))}
          </View>
        </Card>

        {/* Section 3: Monthly Budgets */}
        <Card variant="outlined" className="gap-3.5">
          <View className="flex-row items-center gap-2">
            <PiggyBank size={18} color={theme.primary} />
            <AppText className="text-base font-bold text-foreground">
              Monthly Budget Limits
            </AppText>
          </View>

          {budgetList.length === 0 ? (
            <AppText className="text-xs text-muted-foreground">
              No monthly budget caps configured yet.
            </AppText>
          ) : (
            <View className="gap-2">
              {budgetList.map((b) => (
                <View
                  key={b.id}
                  className="flex-row items-center justify-between rounded-xl px-3.5 py-2.5"
                  style={{ backgroundColor: theme.surfaceContainer || theme.card }}
                >
                  <AppText className="text-sm font-medium text-foreground">
                    {b.category_id || "Category"}
                  </AppText>
                  <AmountText
                    value={b.monthly_limit}
                    colorBySign={false}
                    className="text-sm font-bold text-foreground"
                  />
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
