import { useState, useMemo } from "react";
import { View, FlatList, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Search, ArrowLeftRight } from "lucide-react-native";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { AppText } from "@/components/common/AppText";
import { Chip } from "@/components/common/Chip";
import { PaginationControl } from "@/components/common/PaginationControl";
import { Fab } from "@/components/common/Fab";
import { TransactionListItem, type TransactionListItemData } from "@/components/transactions/TransactionListItem";
import { TransactionListSkeleton } from "@/components/transactions/TransactionListSkeleton";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { AppHeader } from "@/components/common/AppHeader";
import { Dialog } from "@/components/common/Dialog";
import { useTheme } from "@/theme/ThemeProvider";

type FilterType = "All" | "Expense" | "Income" | "Transfer";

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filterType, setFilterType] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: accounts } = useAccounts(true);
  const { data: categories } = useCategories();
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    createTransaction,
    deleteTransaction,
  } = useTransactions({ page });

  const rawTransactions = data ?? [];

  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter((tx) => {
      // Filter by type (case-insensitive check for API and schema resilience)
      if (
        filterType !== "All" &&
        tx.type?.toLowerCase() !== filterType.toLowerCase()
      ) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const categoryMatch = tx.category?.name?.toLowerCase().includes(query) ?? false;
        const notesMatch = tx.notes?.toLowerCase().includes(query) ?? false;
        const accountMatch = tx.from_account?.name?.toLowerCase().includes(query) ?? false;
        if (!categoryMatch && !notesMatch && !accountMatch) {
          return false;
        }
      }
      return true;
    });
  }, [rawTransactions, filterType, searchQuery]);

  const totalCount = filteredTransactions.length;
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(page * pageSize, (page + 1) * pageSize);
  }, [filteredTransactions, page, pageSize]);

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader title="Transactions" />
      {/* Top Header */}
      <View className="px-4 pt-2 pb-3 gap-3">
        <View className="flex-row items-center justify-between">
          <View>
            <AppText className="text-2xl font-bold tracking-tight text-foreground">
              Transactions
            </AppText>
            <AppText className="text-xs text-muted-foreground">
              {filteredTransactions.length} records found
            </AppText>
          </View>
        </View>

        {/* Search Bar */}
        <View
          className="h-11 flex-row items-center rounded-full border px-4"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
        >
          <Search size={16} color={theme.mutedForeground} />
          <TextInput
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setPage(0);
            }}
            placeholder="Search notes, category, account..."
            placeholderTextColor={theme.mutedForeground}
            className="flex-1 px-3 text-sm text-foreground"
            style={{ paddingVertical: 0 }}
          />
        </View>

        {/* M3 Filter Chips with unified theme primary color */}
        <View className="flex-row items-center gap-2">
          <Chip
            label="All"
            selected={filterType === "All"}
            onPress={() => {
              setFilterType("All");
              setPage(0);
            }}
            activeColor={theme.primary}
          />
          <Chip
            label="Expense"
            selected={filterType === "Expense"}
            onPress={() => {
              setFilterType("Expense");
              setPage(0);
            }}
            activeColor={theme.primary}
          />
          <Chip
            label="Income"
            selected={filterType === "Income"}
            onPress={() => {
              setFilterType("Income");
              setPage(0);
            }}
            activeColor={theme.primary}
          />
          <Chip
            label="Transfer"
            selected={filterType === "Transfer"}
            onPress={() => {
              setFilterType("Transfer");
              setPage(0);
            }}
            activeColor={theme.primary}
          />
        </View>
      </View>

      {/* Transactions List */}
      {isLoading ? (
        <TransactionListSkeleton />
      ) : filteredTransactions.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8 gap-3">
          <View
            className="size-16 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.surfaceContainerHighest }}
          >
            <ArrowLeftRight size={28} color={theme.mutedForeground} />
          </View>
          <AppText className="text-base font-semibold text-foreground">
            No transactions found
          </AppText>
          <AppText className="text-center text-xs text-muted-foreground">
            {searchQuery ? "Try a different search query" : "Tap '+' to add your first transaction"}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={paginatedTransactions}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 96 }}
          renderItem={({ item, index }) => {
            const txData: TransactionListItemData = {
              id: item.id,
              date: item.date,
              type: item.type,
              amount: item.amount,
              categoryName: item.category?.name ?? null,
              accountName: item.from_account?.name ?? null,
              notes: item.notes ?? null,
            };
            return (
              <TransactionListItem
                transaction={txData}
                onPress={() => {}}
                onDelete={handleDelete}
                index={index}
              />
            );
          }}
          ListFooterComponent={
            totalCount > 0 ? (
              <View className="px-4 pb-20">
                <PaginationControl
                  page={page}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 25, 50, 100]}
                />
              </View>
            ) : null
          }
        />
      )}

      {/* M3 FAB for Adding Transaction */}
      <View className="absolute bottom-6 right-5">
        <Fab
          icon={<Plus size={24} color={theme.onPrimary} />}
          onPress={() => setShowAddSheet(true)}
        />
      </View>

      {/* Add Transaction Sheet */}
      <AddTransactionSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        accounts={accounts ?? []}
        categories={categories ?? []}
        onSubmit={(data) => createTransaction(data)}
      />

      {/* React Native Delete Transaction Confirmation Dialog */}
      <Dialog
        visible={!!deleteTargetId}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          if (deleteTargetId) {
            deleteTransaction(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </SafeAreaView>
  );
}
