import { useState, useMemo } from "react";
import { View, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, TrendingUp } from "lucide-react-native";
import { useInvestmentLog, useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useAccounts } from "@/hooks/useAccounts";
import { AppText } from "@/components/common/AppText";
import { AppHeader } from "@/components/common/AppHeader";
import {
  PaginationControl,
  PaginationHeader,
} from "@/components/common/PaginationControl";
import { EmptyTableRows } from "@/components/common/EmptyTableRows";
import { Fab } from "@/components/common/Fab";
import {
  InvestmentLogListItem,
  type InvestmentLogListItemData,
} from "@/components/investments/InvestmentLogListItem";
import { AddInvestmentSheet } from "@/components/investments/AddInvestmentSheet";
import { Dialog } from "@/components/common/Dialog";
import { useTheme } from "@/theme/ThemeProvider";

export default function InvestmentsScreen() {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5); // Default 5 rows per page
  const [sheetVisible, setSheetVisible] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: accounts } = useAccounts(true);
  const { data: allLogs } = useAllInvestmentLog();
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    createInvestmentLog,
    deleteInvestmentLog,
  } = useInvestmentLog({ page, pageSize });

  // Use allLogs as authoritative source for robust pagination, fallback to query data
  const rawLogs = useMemo(() => {
    return allLogs ?? data ?? [];
  }, [allLogs, data]);

  const totalCount = rawLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  const paginatedLogs = useMemo(() => {
    return rawLogs.slice(safePage * pageSize, (safePage + 1) * pageSize);
  }, [rawLogs, safePage, pageSize]);

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader showBack={true} />

      {/* Header Info */}
      <View className="px-4 pt-2 pb-2 gap-1 border-b border-outline-variant/20">
        <View className="flex-row items-center justify-between">
          <View>
            <AppText className="text-2xl font-bold tracking-tight text-foreground">
              Investment Log
            </AppText>
            <AppText className="text-xs text-muted-foreground">
              {totalCount} trade transactions recorded
            </AppText>
          </View>
        </View>

        {/* Telemetry Header Row (Showing X–Y of Z and N / page [tune]) */}
        {totalCount > 0 && (
          <PaginationHeader
            page={safePage}
            pageSize={pageSize}
            totalCount={totalCount}
            onOpenSheet={() => setSheetVisible(true)}
            className="pt-1.5"
          />
        )}
      </View>

      {rawLogs.length === 0 && !isLoading ? (
        <View className="flex-1 items-center justify-center p-8 gap-3">
          <View
            className="size-16 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.surfaceContainerHighest }}
          >
            <TrendingUp size={28} color={theme.mutedForeground} />
          </View>
          <AppText className="text-base font-semibold text-foreground">
            No investment trades recorded
          </AppText>
          <AppText className="text-center text-xs text-muted-foreground">
            Tap '+' below to log stock buys, sells, or SIPs.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={paginatedLogs}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 80,
          }}
          renderItem={({ item }) => {
            const itemData: InvestmentLogListItemData = {
              id: item.id,
              date: item.date,
              symbol: item.symbol,
              action: item.action,
              quantity: item.quantity,
              price: item.price,
              fees: item.fees,
              accountName: null,
            };
            return (
              <InvestmentLogListItem
                investment={itemData}
                onPress={() => {}}
                onDelete={handleDelete}
              />
            );
          }}
          ListFooterComponent={
            <EmptyTableRows
              currentCount={paginatedLogs.length}
              pageSize={pageSize}
              rowHeight={72}
            />
          }
        />
      )}

      {/* Fixed Bottom Pagination Dock */}
      {totalCount > 0 && (
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
            page={safePage}
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

      {/* Floating Add Trade FAB (positioned above fixed dock) */}
      <View
        className="absolute right-5"
        style={{
          bottom: totalCount > 0 ? 76 : 24,
        }}
      >
        <Fab
          icon={<Plus size={24} color={theme.onPrimary} />}
          onPress={() => setShowAdd(true)}
        />
      </View>

      {/* Add Investment Sheet */}
      <AddInvestmentSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        accounts={accounts ?? []}
        onSubmit={async (itemData) => {
          await createInvestmentLog(itemData);
          setShowAdd(false);
        }}
      />

      {/* React Native Delete Trade Confirmation Dialog */}
      <Dialog
        visible={!!deleteTargetId}
        title="Delete Trade"
        description="Are you sure you want to remove this trade log? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          if (deleteTargetId) {
            deleteInvestmentLog(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </SafeAreaView>
  );
}
