import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Users, UploadCloud } from "lucide-react-native";
import { useCashbook } from "@/hooks/useCashbook";
import { useAccounts } from "@/hooks/useAccounts";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import type { CashbookInput } from "@repo/shared/schemas";
import type { getCashbook } from "@repo/shared/queries/cashbook";
import { getCashbookForDedup, createCashbookBulk } from "@repo/shared/queries/cashbook";
import { buildNameIndex, buildCashbookImportPlan, CASHBOOK_TEMPLATE_COLUMNS } from "@repo/shared";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { AppText } from "@/components/common/AppText";
import { CounterpartySummaryCard } from "@/components/cashbook/CounterpartySummaryCard";
import { CashbookListItem } from "@/components/cashbook/CashbookListItem";
import { TransactionListSkeleton } from "@/components/transactions/TransactionListSkeleton";
import { AddCashbookSheet } from "@/components/cashbook/AddCashbookSheet";
import { ImportSheet } from "@/components/shared/ImportSheet";
import { useThemeColor } from "@/lib/colors";

type CashbookEntry = NonNullable<Awaited<ReturnType<typeof getCashbook>>>[number];

export default function CashbookScreen() {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<CashbookEntry[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CashbookEntry | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [preparingImport, setPreparingImport] = useState(false);
  const [existingKeys, setExistingKeys] = useState<string[]>([]);

  const { user } = useAuth();
  const supabase = useSupabaseClient();
  const foreground = useThemeColor("foreground");
  const { data: accounts } = useAccounts(true);
  const { data, summary, isLoading, error, createCashbook, updateCashbook, deleteCashbook } = useCashbook({ page });

  async function openImport() {
    if (!user) return;
    setPreparingImport(true);
    try {
      const existing = await getCashbookForDedup(supabase, user.id);
      setExistingKeys((existing ?? []).map((c) => `${c.date}|${c.counterparty.toLowerCase()}|${Number(c.amount)}|${c.flow}`));
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

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Delete entry?", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCashbook(id);
            setItems((prev) => prev.filter((c) => c.id !== id));
          },
        },
      ]);
    },
    [deleteCashbook]
  );

  const handleEdit = useCallback(
    (id: string) => {
      setEditing(items.find((c) => c.id === id) ?? null);
      setSheetOpen(true);
    },
    [items]
  );

  async function handleSubmit(data: CashbookInput) {
    if (editing) {
      await updateCashbook({ id: editing.id, data });
    } else {
      await createCashbook(data);
    }
    setSheetOpen(false);
    setEditing(null);
    setPage(0);
  }

  const showEmptyState = !isLoading && page === 0 && items.length === 0;
  const summaryEntries = summary ? Object.entries(summary) : [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="gap-4 p-4 pb-0">
        <PageHeader
          title="Cashbook"
          description="Track personal lending and borrowing."
          action={
            <View className="flex-row items-center gap-2">
              <Button variant="outline" className="size-11 px-0" onPress={openImport} disabled={preparingImport}>
                <UploadCloud size={16} color={foreground} />
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
      </View>

      {error ? (
        <View className="p-4">
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        </View>
      ) : showEmptyState ? (
        <View className="p-4">
          <EmptyState
            icon={Users}
            title="No cashbook entries yet"
            description="Log your first lending or borrowing entry to start tracking."
            action={
              <Button onPress={() => setSheetOpen(true)}>
                <Plus size={16} color="white" />
                <AppText className="text-sm font-medium text-primary-foreground">Add Entry</AppText>
              </Button>
            }
          />
        </View>
      ) : isLoading && items.length === 0 ? (
        <TransactionListSkeleton />
      ) : (
        <FlatList
          className="mt-2"
          contentContainerStyle={{ paddingBottom: 128 }}
          data={items}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            summaryEntries.length > 0 ? (
              <View className="gap-3 px-4 pb-4">
                {summaryEntries.map(([counterparty, item]) => (
                  <CounterpartySummaryCard key={counterparty} counterparty={counterparty} {...item} />
                ))}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <CashbookListItem
              entry={{
                id: item.id,
                date: item.date,
                counterparty: item.counterparty,
                flow: item.flow,
                amount: item.amount,
                dueDate: item.due_date,
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

      <AddCashbookSheet
        visible={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        accounts={accounts ?? []}
        editing={
          editing
            ? {
                date: editing.date,
                counterparty: editing.counterparty,
                flow: editing.flow,
                amount: editing.amount,
                due_date: editing.due_date ?? undefined,
                account_used_id: editing.account_used_id ?? undefined,
                loan_id: editing.loan_id ?? undefined,
                notes: editing.notes ?? undefined,
              }
            : undefined
        }
      />

      <ImportSheet
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        entityLabel="cashbook"
        templateColumns={CASHBOOK_TEMPLATE_COLUMNS}
        buildPlan={(records) => buildCashbookImportPlan(records, buildNameIndex(accounts ?? []), existingKeys)}
        createBulk={(rows) => (user ? createCashbookBulk(supabase, user.id, rows) : Promise.reject(new Error("Not authenticated")))}
        onImported={() => setPage(0)}
      />
    </SafeAreaView>
  );
}
