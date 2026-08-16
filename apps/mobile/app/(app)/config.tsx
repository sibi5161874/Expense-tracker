import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useBudgetLimits } from "@/hooks/useBudgetLimits";
import { accountSchema, categorySchema, type AccountInput, type CategoryInput, type BudgetLimitInput } from "@repo/shared/schemas";
import { formatINR } from "@repo/shared/utils/currency";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { AppText } from "@/components/common/AppText";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { AssetForm, type AssetFieldConfig } from "@/components/assets/AssetForm";
import { confirmAssetDelete, findEditingRow, submitAssetForm, toFormDefaults } from "@/components/assets/assetFormHelpers";
import { ConfigListItem } from "@/components/config/ConfigListItem";
import { AddBudgetLimitSheet } from "@/components/config/AddBudgetLimitSheet";
import { useThemeColor } from "@/lib/colors";

const CONFIG_TABS = [
  { value: "accounts", label: "Accounts" },
  { value: "categories", label: "Categories" },
  { value: "budgets", label: "Budgets" },
];

const ACCOUNT_FIELDS: readonly AssetFieldConfig<AccountInput>[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "type", label: "Type", type: "text" },
  { name: "opening_balance", label: "Opening Balance", type: "number" },
  { name: "currency", label: "Currency", type: "text" },
  { name: "is_active", label: "Active", type: "boolean" },
];
const ACCOUNT_DEFAULTS: AccountInput = { name: "", type: "", opening_balance: 0, currency: "INR", is_active: true };

const CATEGORY_FIELDS: readonly AssetFieldConfig<CategoryInput>[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "type", label: "Type", type: "enum", options: ["Income", "Expense", "Transfer"] },
];
const CATEGORY_DEFAULTS: CategoryInput = { name: "", type: "Expense" };

export default function ConfigScreen() {
  const [tab, setTab] = useState("accounts");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const primary = useThemeColor("primary");

  const accounts = useAccounts();
  const categories = useCategories();
  const budgets = useBudgetLimits();

  function openAdd() {
    setEditingId(null);
    setSheetOpen(true);
  }
  function openEdit(id: string) {
    setEditingId(id);
    setSheetOpen(true);
  }
  function closeSheet() {
    setSheetOpen(false);
    setEditingId(null);
  }

  const isLoading = { accounts, categories, budgets }[tab as "accounts" | "categories" | "budgets"].isLoading;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader
          title="Config"
          action={
            <Button onPress={openAdd}>
              <Plus size={16} color="white" />
              <AppText className="text-sm font-medium text-primary-foreground">Add</AppText>
            </Button>
          }
        />

        <SegmentedControl options={CONFIG_TABS} value={tab} onChange={setTab} />

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : (
          <View className="gap-2">
            {tab === "accounts" &&
              accounts.data?.map((a) => (
                <ConfigListItem
                  key={a.id}
                  title={a.name}
                  subtitle={`${a.type} · ${formatINR(a.opening_balance)}${a.is_active ? "" : " · Inactive"}`}
                  onEdit={() => openEdit(a.id)}
                  onDelete={() => confirmAssetDelete(() => accounts.deleteAccount(a.id))}
                />
              ))}
            {tab === "categories" &&
              categories.data?.map((c) => (
                <ConfigListItem key={c.id} title={c.name} subtitle={c.type} onEdit={() => openEdit(c.id)} onDelete={() => confirmAssetDelete(() => categories.deleteCategory(c.id))} />
              ))}
            {tab === "budgets" &&
              budgets.data?.map((b) => (
                <ConfigListItem
                  key={b.id}
                  title={b.category?.name ?? "Unknown category"}
                  subtitle={formatINR(b.monthly_limit)}
                  onEdit={() => openEdit(b.id)}
                  onDelete={() => confirmAssetDelete(() => budgets.deleteBudgetLimit(b.id))}
                />
              ))}
            {({ accounts, categories, budgets }[tab as "accounts" | "categories" | "budgets"].data?.length ?? 0) === 0 && (
              <AppText className="py-8 text-center text-sm text-muted-foreground">Nothing here yet. Add your first one to get started.</AppText>
            )}
          </View>
        )}
      </ScrollView>

      {tab === "accounts" && (
        <AssetForm
          visible={sheetOpen}
          title={editingId ? "Edit Account" : "Add Account"}
          schema={accountSchema}
          fields={ACCOUNT_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(accounts.data, editingId), ACCOUNT_FIELDS, ACCOUNT_DEFAULTS)}
          onClose={closeSheet}
          onSubmit={(data) => submitAssetForm(editingId, data, accounts.createAccount, accounts.updateAccount, closeSheet)}
        />
      )}
      {tab === "categories" && (
        <AssetForm
          visible={sheetOpen}
          title={editingId ? "Edit Category" : "Add Category"}
          schema={categorySchema}
          fields={CATEGORY_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(categories.data, editingId), CATEGORY_FIELDS, CATEGORY_DEFAULTS)}
          onClose={closeSheet}
          onSubmit={(data) => submitAssetForm(editingId, data, categories.createCategory, categories.updateCategory, closeSheet)}
        />
      )}
      {tab === "budgets" && (
        <AddBudgetLimitSheet
          visible={sheetOpen}
          categories={categories.data ?? []}
          editing={
            editingId
              ? (() => {
                  const row = findEditingRow(budgets.data, editingId);
                  return row ? ({ category_id: row.category_id, monthly_limit: row.monthly_limit } as BudgetLimitInput) : undefined;
                })()
              : undefined
          }
          onClose={closeSheet}
          onSubmit={(data) => submitAssetForm(editingId, data, budgets.createBudgetLimit, budgets.updateBudgetLimit, closeSheet)}
        />
      )}
    </SafeAreaView>
  );
}
