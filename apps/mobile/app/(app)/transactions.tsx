import { useState, useMemo } from "react";
import { View, FlatList, Pressable, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Search, ArrowLeftRight } from "lucide-react-native";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { AppText } from "@/components/common/AppText";
import { Chip } from "@/components/common/Chip";
import {
  PaginationControl,
  PaginationHeader,
} from "@/components/common/PaginationControl";
import { EmptyTableRows } from "@/components/common/EmptyTableRows";
import { Fab } from "@/components/common/Fab";
import {
  TransactionListItem,
  type TransactionListItemData,
} from "@/components/transactions/TransactionListItem";
import { TransactionListSkeleton } from "@/components/transactions/TransactionListSkeleton";
import { TransactionsCalendarView } from "@/components/transactions/TransactionsCalendarView";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { AppHeader } from "@/components/common/AppHeader";
import { Dialog } from "@/components/common/Dialog";
import { useTheme } from "@/theme/ThemeProvider";

type FilterType = "All" | "Expense" | "Income" | "Transfer";
type ViewMode = "list" | "calendar";

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5); // Default 5 rows per page
  const [filterType, setFilterType] = useState<FilterType>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
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
        const categoryMatch =
          tx.category?.name?.toLowerCase().includes(query) ?? false;
        const notesMatch = tx.notes?.toLowerCase().includes(query) ?? false;
        const accountMatch =
          tx.from_account?.name?.toLowerCase().includes(query) ?? false;
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
      <View className="px-4 pt-2 pb-2 gap-2.5">
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

        {/* Filter Chips & View Mode Toggle (matches transactions_mobile_pagination.html) */}
        <View className="flex-row items-center justify-between gap-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            className="flex-1"
          >
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
          </ScrollView>

          {/* List / Calendar View Toggle Segmented Pill */}
          <View
            className="flex-row items-center p-1 rounded-xl border"
            style={{
              backgroundColor: theme.surfaceContainerLow || theme.card,
              borderColor: theme.outlineVariant
                ? `${theme.outlineVariant}44`
                : theme.border,
            }}
          >
            <Pressable
              onPress={() => setViewMode("list")}
              accessibilityRole="button"
              accessibilityLabel="Switch to list view"
              className="px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor:
                  viewMode === "list"
                    ? theme.secondaryContainer || theme.primary
                    : "transparent",
              }}
            >
              <AppText
                className="text-xs font-semibold"
                style={{
                  color:
                    viewMode === "list"
                      ? theme.onSecondaryContainer || theme.onPrimary || "#ffffff"
                      : theme.mutedForeground,
                }}
              >
                List
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => setViewMode("calendar")}
              accessibilityRole="button"
              accessibilityLabel="Switch to calendar view"
              className="px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor:
                  viewMode === "calendar"
                    ? theme.secondaryContainer || theme.primary
                    : "transparent",
              }}
            >
              <AppText
                className="text-xs font-semibold"
                style={{
                  color:
                    viewMode === "calendar"
                      ? theme.onSecondaryContainer || theme.onPrimary || "#ffffff"
                      : theme.mutedForeground,
                }}
              >
                Calendar
              </AppText>
            </Pressable>
          </View>
        </View>

        {/* Telemetry Header Row (Showing X–Y of Z and N / page [tune]) */}
        {viewMode === "list" && totalCount > 0 && (
          <PaginationHeader
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onOpenSheet={() => setSheetVisible(true)}
          />
        )}
      </View>

      {/* Main Content Area */}
      {viewMode === "calendar" ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
        >
          <TransactionsCalendarView />
        </ScrollView>
      ) : isLoading ? (
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
            {searchQuery
              ? "Try a different search query"
              : "Tap '+' to add your first transaction"}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={paginatedTransactions}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 80,
          }}
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
            <EmptyTableRows
              currentCount={paginatedTransactions.length}
              pageSize={pageSize}
              rowHeight={72}
            />
          }
        />
      )}

      {/* Fixed Bottom Pagination Dock (stayed fixed at bottom matching HTML design) */}
      {viewMode === "list" && totalCount > 0 && (
        <View
          className="px-4 py-2 border-t"
          style={{
            backgroundColor: theme.surfaceContainer || theme.card,
            borderColor: theme.outlineVariant
              ? `${theme.outlineVariant}33`
              : theme.border,
          }}
        >
          <PaginationControl
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 25, 50, 100]}
            showTelemetry={false}
            sheetVisible={sheetVisible}
            onSheetVisibilityChange={setSheetVisible}
          />
        </View>
      )}

      {/* M3 FAB for Adding Transaction (positioned safely above fixed dock) */}
      <View
        className="absolute right-5"
        style={{
          bottom: viewMode === "list" && totalCount > 0 ? 76 : 24,
        }}
      >
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
