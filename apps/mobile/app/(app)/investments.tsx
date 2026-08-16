import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, TrendingUp, UploadCloud } from "lucide-react-native";
import { useInvestmentLog } from "@/hooks/useInvestmentLog";
import { useAccounts } from "@/hooks/useAccounts";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import type { InvestmentLogInput } from "@repo/shared/schemas";
import type { getInvestmentLog } from "@repo/shared/queries/investmentLog";
import { getInvestmentLogForDedup, createInvestmentLogsBulk } from "@repo/shared/queries/investmentLog";
import { buildNameIndex, buildInvestmentLogImportPlan, INVESTMENT_LOG_TEMPLATE_COLUMNS } from "@repo/shared";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { AppText } from "@/components/common/AppText";
import { InvestmentLogListItem } from "@/components/investments/InvestmentLogListItem";
import { TransactionListSkeleton } from "@/components/transactions/TransactionListSkeleton";
import { AddInvestmentSheet } from "@/components/investments/AddInvestmentSheet";
import { ImportSheet } from "@/components/shared/ImportSheet";
import { useThemeColor } from "@/lib/colors";

type InvestmentLogEntry = NonNullable<Awaited<ReturnType<typeof getInvestmentLog>>>[number];

export default function InvestmentsScreen() {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<InvestmentLogEntry[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<InvestmentLogEntry | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [preparingImport, setPreparingImport] = useState(false);
  const [existingKeys, setExistingKeys] = useState<string[]>([]);

  const { user } = useAuth();
  const supabase = useSupabaseClient();
  const foreground = useThemeColor("foreground");
  const { data: accounts } = useAccounts(true);
  const { data, isLoading, error, createInvestmentLog, updateInvestmentLog, deleteInvestmentLog } = useInvestmentLog({
    page,
  });

  async function openImport() {
    if (!user) return;
    setPreparingImport(true);
    try {
      const existing = await getInvestmentLogForDedup(supabase, user.id);
      setExistingKeys((existing ?? []).map((i) => `${i.date}|${i.symbol}|${Number(i.quantity)}|${Number(i.price)}`));
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
      Alert.alert("Delete investment?", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteInvestmentLog(id);
            setItems((prev) => prev.filter((i) => i.id !== id));
          },
        },
      ]);
    },
    [deleteInvestmentLog]
  );

  const handleEdit = useCallback(
    (id: string) => {
      setEditing(items.find((i) => i.id === id) ?? null);
      setSheetOpen(true);
    },
    [items]
  );

  async function handleSubmit(data: InvestmentLogInput) {
    if (editing) {
      await updateInvestmentLog({ id: editing.id, data });
    } else {
      await createInvestmentLog(data);
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
          title="Investment Log"
          description="Every buy, sell, SIP, dividend, bonus, and split event."
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
            icon={TrendingUp}
            title="No investments yet"
            description="Log your first buy, SIP, or dividend to start tracking your portfolio."
            action={
              <Button onPress={() => setSheetOpen(true)}>
                <Plus size={16} color="white" />
                <AppText className="text-sm font-medium text-primary-foreground">Add Investment</AppText>
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
          renderItem={({ item }) => (
            <InvestmentLogListItem
              investment={{
                id: item.id,
                date: item.date,
                symbol: item.symbol,
                action: item.action,
                quantity: item.quantity,
                price: item.price,
                fees: item.fees,
                accountName: item.linked_account?.name ?? null,
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

      <AddInvestmentSheet
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
                symbol: editing.symbol,
                exchange: editing.exchange,
                action: editing.action,
                quantity: editing.quantity,
                price: editing.price,
                fees: editing.fees,
                bonus_split_extra_units: editing.bonus_split_extra_units ?? undefined,
                linked_account_id: editing.linked_account_id,
                asset_type: editing.asset_type,
                notes: editing.notes ?? undefined,
              }
            : undefined
        }
      />

      <ImportSheet
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        entityLabel="investment log"
        templateColumns={INVESTMENT_LOG_TEMPLATE_COLUMNS}
        buildPlan={(records) => buildInvestmentLogImportPlan(records, buildNameIndex(accounts ?? []), existingKeys)}
        createBulk={(rows) => (user ? createInvestmentLogsBulk(supabase, user.id, rows) : Promise.reject(new Error("Not authenticated")))}
        onImported={() => setPage(0)}
      />
    </SafeAreaView>
  );
}
