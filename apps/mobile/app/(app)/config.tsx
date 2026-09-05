import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useBudgetLimits } from "@/hooks/useBudgetLimits";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import {
  accountSchema,
  categorySchema,
  type AccountInput,
  type CategoryInput,
  type BudgetLimitInput,
  type RecurringTransactionInput,
} from "@repo/shared/schemas";
import { SUPPORTED_CURRENCIES } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { AppText } from "@/components/common/AppText";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { AssetForm, type AssetFieldConfig } from "@/components/assets/AssetForm";
import { confirmAssetDelete, findEditingRow, submitAssetForm, toFormDefaults } from "@/components/assets/assetFormHelpers";
import { ConfigListItem } from "@/components/config/ConfigListItem";
import { AddBudgetLimitSheet } from "@/components/config/AddBudgetLimitSheet";
import { RecurringTransactionListItem } from "@/components/config/RecurringTransactionListItem";
import { RecurringTransactionSheet } from "@/components/transactions/RecurringTransactionSheet";
import { useThemeColor } from "@/lib/colors";

const CONFIG_TABS = [
  { value: "accounts", label: "Accounts" },
  { value: "categories", label: "Categories" },
  { value: "budgets", label: "Budgets" },
  { value: "recurring", label: "Recurring" },
];

const ACCOUNT_FIELDS: readonly AssetFieldConfig<AccountInput>[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "type", label: "Type", type: "text" },
  { name: "opening_balance", label: "Opening Balance", type: "number" },
  { name: "currency", label: "Currency", type: "enum", options: SUPPORTED_CURRENCIES.map((c) => c.code) },
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
  const recurring = useRecurringTransactions();

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

  const isLoading = { accounts, categories, budgets, recurring }[tab as "accounts" | "categories" | "budgets" | "recurring"]
    .isLoading;

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

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <SegmentedControl options={CONFIG_TABS} value={tab} onChange={setTab} />
        </ScrollView>

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
            {tab === "recurring" &&
              recurring.data?.map((rt) => (
                <RecurringTransactionListItem
                  key={rt.id}
                  recurringTransaction={rt}
                  onEdit={() => openEdit(rt.id)}
                  onDelete={(id) => confirmAssetDelete(() => recurring.deleteRecurringTransaction(id))}
                  onToggleActive={(rt) => recurring.updateRecurringTransaction({ id: rt.id, data: { is_active: !rt.is_active } })}
                  isDeleting={recurring.isDeleting}
                />
              ))}
            {tab === "recurring" && recurring.data?.length === 0 && (
              <AppText className="py-8 text-center text-sm text-muted-foreground">
                No recurring transactions set up. Add rent, salary, or EMIs to auto-generate them each period.
              </AppText>
            )}
            {tab !== "recurring" &&
              ({ accounts, categories, budgets }[tab as "accounts" | "categories" | "budgets"].data?.length ?? 0) === 0 && (
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
      {tab === "recurring" && (
        <RecurringTransactionSheet
          visible={sheetOpen}
          accounts={accounts.data ?? []}
          categories={categories.data ?? []}
          editing={
            editingId
              ? (() => {
                  const row = findEditingRow(recurring.data, editingId);
                  return row
                    ? ({
                        type: row.type,
                        category_id: row.category_id,
                        sub_category: row.sub_category ?? undefined,
                        amount: row.amount,
                        from_account_id: row.from_account_id,
                        to_account_id: row.to_account_id,
                        notes: row.notes ?? undefined,
                        frequency: row.frequency,
                        next_run_date: row.next_run_date,
                        is_active: row.is_active,
                      } as RecurringTransactionInput)
                    : undefined;
                })()
              : undefined
          }
          onClose={closeSheet}
          onSubmit={(data) => submitAssetForm(editingId, data, recurring.createRecurringTransaction, recurring.updateRecurringTransaction, closeSheet)}
        />
      )}
    </SafeAreaView>
  );
}
