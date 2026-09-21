import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Plus, Receipt, UploadCloud, Landmark, Lock } from "lucide-react-native";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import type { TransactionInput } from "@repo/shared/schemas";
import type { getTransactions } from "@repo/shared/queries/transactions";
import { getTransactionsForDedup, createTransactionsBulk } from "@repo/shared/queries/transactions";
import { buildNameIndex, buildTransactionImportPlan, TRANSACTIONS_TEMPLATE_COLUMNS } from "@repo/shared";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { AppText } from "@/components/common/AppText";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { TransactionListItem } from "@/components/transactions/TransactionListItem";
import { TransactionListSkeleton } from "@/components/transactions/TransactionListSkeleton";
import { TransactionsCalendarView } from "@/components/transactions/TransactionsCalendarView";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { ImportSheet } from "@/components/shared/ImportSheet";
import { BankStatementImportSheet } from "@/components/shared/BankStatementImportSheet";
import { useThemeColor } from "@/lib/colors";

type Transaction = NonNullable<Awaited<ReturnType<typeof getTransactions>>>[number];
type ViewMode = "list" | "calendar";

// FlatList onEndReached infinite scroll is the mobile-appropriate equivalent of web's
// Previous/Next pager — a click pager doesn't translate to a phone.
export default function TransactionsScreen() {
  const [page, setPage] = useState(0);
  const [view, setView] = useState<ViewMode>("list");
  const [items, setItems] = useState<Transaction[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [bankImportOpen, setBankImportOpen] = useState(false);
  const [preparingImport, setPreparingImport] = useState(false);
  const [existingKeys, setExistingKeys] = useState<string[]>([]);

  const { user } = useAuth();
  const supabase = useSupabaseClient();
  const { hasFeature } = useEntitlements();
  const foreground = useThemeColor("foreground");
  const { data: accounts } = useAccounts(true);
  const { data: categories } = useCategories();
  const { data, isLoading, error, refetch, isRefetching, createTransaction, updateTransaction, deleteTransaction } =
    useTransactions({ page });
  const isOnline = useNetworkStatus();
  const [refreshPending, setRefreshPending] = useState(false);

  function openBankImport() {
    if (!hasFeature("bankStatementImport")) {
      Alert.alert("Pro feature", "Bank statement import is a Pro feature.", [
        { text: "Not now", style: "cancel" },
        { text: "View plans", onPress: () => router.push("/(app)/billing") },
      ]);
      return;
    }
    setBankImportOpen(true);
  }

  async function openImport() {
    if (!user) return;
    setPreparingImport(true);
    try {
      const existing = await getTransactionsForDedup(supabase, user.id);
      setExistingKeys((existing ?? []).map((t) => `${t.date}|${t.category_id ?? ""}|${Number(t.amount)}`));
      setImportOpen(true);
    } finally {
      setPreparingImport(false);
    }
  }

  useEffect(() => {
    if (!data) return;
    setItems((prev) => (page === 0 ? data : [...prev, ...data]));
  }, [data, page]);

  const hasMore = (data?.length ?? 0) >= 50;

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) setPage((p) => p + 1);
  }, [hasMore, isLoading]);

  // Pull-to-refresh always means "show me the latest from the top", not "reload whatever page
  // I've scrolled to" — so it resets to page 0 first. `refetch()` is bound to whichever page's
  // query is active *in this render*, so it can't force-refresh page 0 in the same tick as
  // setPage(0); the effect below fires once the page-0 query is actually active and force-
  // refetches it (bypassing the 30s staleTime), then clears the pending flag.
  const handleRefresh = useCallback(() => {
    setRefreshPending(true);
    setPage(0);
  }, []);

  useEffect(() => {
    if (!refreshPending || page !== 0) return;
    // The global OfflineBanner already tells the user why nothing's changing — don't also
    // fire a doomed network request off the back of their pull gesture.
    if (!isOnline) {
      setRefreshPending(false);
      return;
    }
    refetch().finally(() => setRefreshPending(false));
  }, [refreshPending, page, isOnline, refetch]);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Delete transaction?", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTransaction(id);
            setItems((prev) => prev.filter((t) => t.id !== id));
          },
        },
      ]);
    },
    [deleteTransaction]
  );

  const handleEdit = useCallback(
    (id: string) => {
      const found = items.find((t) => t.id === id) ?? null;
      setEditing(found);
      setSheetOpen(true);
    },
    [items]
  );

  async function handleSubmit(data: TransactionInput) {
    if (editing) {
      await updateTransaction({ id: editing.id, data });
    } else {
      await createTransaction(data);
    }
    setSheetOpen(false);
    setEditing(null);
    setPage(0);
  }

  const showEmptyState = !isLoading && page === 0 && items.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="gap-4 p-4 pb-0">
        <PageHeader
          title="Transactions"
          description="Track your income, expenses, and transfers."
          action={
            <View className="flex-row items-center gap-2">
              <Button variant="outline" className="size-11 px-0" onPress={openImport} disabled={preparingImport}>
                <UploadCloud size={16} color={foreground} />
              </Button>
              <Button variant="outline" className="size-11 px-0" onPress={openBankImport}>
                {hasFeature("bankStatementImport") ? <Landmark size={16} color={foreground} /> : <Lock size={16} color={foreground} />}
              </Button>
              <Button
                onPress={() => {
                  setEditing(null);
                  setSheetOpen(true);
                }}
              >
                <Plus size={16} color="white" />
                <AppText className="text-sm font-medium text-primary-foreground">Add</AppText>
              </Button>
            </View>
          }
        />
        <View className="flex-row justify-end">
          <SegmentedControl
            options={[
              { value: "list", label: "List" },
              { value: "calendar", label: "Calendar" },
            ]}
            value={view}
            onChange={(v) => setView(v as ViewMode)}
          />
        </View>
      </View>

      {view === "calendar" ? (
        <ScrollView contentContainerClassName="p-4 pb-32">
          <TransactionsCalendarView />
        </ScrollView>
      ) : error ? (
        <View className="p-4">
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        </View>
      ) : showEmptyState ? (
        <View className="p-4">
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Log your first income, expense, or transfer to start tracking your cash flow."
            action={
              <Button onPress={() => setSheetOpen(true)}>
                <Plus size={16} color="white" />
                <AppText className="text-sm font-medium text-primary-foreground">Add Transaction</AppText>
              </Button>
            }
          />
        </View>
      ) : isLoading && items.length === 0 ? (
        <TransactionListSkeleton />
      ) : (
        <FlatList
          className="mt-2"
          contentContainerStyle={{ paddingBottom: 160 }}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TransactionListItem
              transaction={{
                id: item.id,
                date: item.date,
                type: item.type,
                amount: item.amount,
                categoryName: item.category?.name ?? null,
                accountName: item.from_account?.name ?? null,
                notes: item.notes,
              }}
              onPress={handleEdit}
              onDelete={handleDelete}
              index={index}
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isLoading && page > 0 ? <TransactionListSkeleton /> : null}
          refreshControl={
            <RefreshControl refreshing={isRefetching || refreshPending} onRefresh={handleRefresh} tintColor={foreground} />
          }
        />
      )}

      <AddTransactionSheet
        visible={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        accounts={accounts ?? []}
        categories={categories ?? []}
        editing={
          editing
            ? {
                date: editing.date,
                type: editing.type,
                amount: editing.amount,
                category_id: editing.category_id ?? undefined,
                sub_category: editing.sub_category ?? undefined,
                from_account_id: editing.from_account_id,
                to_account_id: editing.to_account_id ?? undefined,
                notes: editing.notes ?? undefined,
              }
            : undefined
        }
      />

      <ImportSheet
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        entityLabel="transactions"
        templateColumns={TRANSACTIONS_TEMPLATE_COLUMNS}
        buildPlan={(records) =>
          buildTransactionImportPlan(records, buildNameIndex(accounts ?? []), buildNameIndex(categories ?? []), existingKeys)
        }
        createBulk={(rows) => (user ? createTransactionsBulk(supabase, user.id, rows) : Promise.reject(new Error("Not authenticated")))}
        onImported={() => setPage(0)}
      />

      <BankStatementImportSheet
        visible={bankImportOpen}
        onClose={() => setBankImportOpen(false)}
        onImported={() => setPage(0)}
      />
    </SafeAreaView>
  );
}
