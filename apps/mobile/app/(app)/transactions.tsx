import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Receipt } from "lucide-react-native";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import type { TransactionInput } from "@repo/shared/schemas";
import type { getTransactions } from "@repo/shared/queries/transactions";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { AppText } from "@/components/common/AppText";
import { TransactionListItem } from "@/components/transactions/TransactionListItem";
import { TransactionListSkeleton } from "@/components/transactions/TransactionListSkeleton";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";

type Transaction = NonNullable<Awaited<ReturnType<typeof getTransactions>>>[number];

// FlatList onEndReached infinite scroll is the mobile-appropriate equivalent of web's
// Previous/Next pager — a click pager doesn't translate to a phone.
export default function TransactionsScreen() {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<Transaction[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const { data: accounts } = useAccounts(true);
  const { data: categories } = useCategories();
  const { data, isLoading, error, createTransaction, updateTransaction, deleteTransaction } = useTransactions({ page });

  useEffect(() => {
    if (!data) return;
    setItems((prev) => (page === 0 ? data : [...prev, ...data]));
  }, [data, page]);

  const hasMore = (data?.length ?? 0) >= 50;

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) setPage((p) => p + 1);
  }, [hasMore, isLoading]);

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
            <Button
              onPress={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              <Plus size={16} color="white" />
              <AppText className="text-sm font-medium text-primary-foreground">Add</AppText>
            </Button>
          }
        />
      </View>

      {error ? (
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
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
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
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isLoading && page > 0 ? <TransactionListSkeleton /> : null}
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
    </SafeAreaView>
  );
}
