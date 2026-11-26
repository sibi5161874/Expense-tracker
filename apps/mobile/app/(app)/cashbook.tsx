import { useState, useMemo } from "react";
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Users, ArrowUpRight, ArrowDownRight, BookOpen } from "lucide-react-native";
import { useCashbook } from "@/hooks/useCashbook";
import { useAccounts } from "@/hooks/useAccounts";
import { formatINR } from "@repo/shared/utils";

import { AppText } from "@/components/common/AppText";
import { Card } from "@/components/common/Card";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { AppHeader } from "@/components/common/AppHeader";
import { PaginationControl } from "@/components/common/PaginationControl";
import { Fab } from "@/components/common/Fab";
import { CounterpartySummaryCard } from "@/components/cashbook/CounterpartySummaryCard";
import { CashbookListItem, type CashbookListItemData } from "@/components/cashbook/CashbookListItem";
import { AddCashbookSheet } from "@/components/cashbook/AddCashbookSheet";
import { Dialog } from "@/components/common/Dialog";
import { useTheme } from "@/theme/ThemeProvider";

export default function CashbookScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"people" | "all">("people");
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: accounts } = useAccounts(true);
  const {
    data: entries,
    summary,
    isLoading,
    error,
    createCashbook,
    deleteCashbook,
  } = useCashbook();

  const rawEntries = entries ?? [];
  const totalEntriesCount = rawEntries.length;
  const paginatedEntries = useMemo(() => {
    return rawEntries.slice(page * pageSize, (page + 1) * pageSize);
  }, [rawEntries, page, pageSize]);

  const totalGiven = summary
    ? Object.values(summary).reduce((acc, c) => acc + c.totalGiven, 0)
    : 0;
  const totalReceived = summary
    ? Object.values(summary).reduce((acc, c) => acc + c.totalReceived, 0)
    : 0;
  const netPosition = totalGiven - totalReceived;
  const isNetPositive = netPosition >= 0;

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

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
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View>
            <AppText className="text-2xl font-bold tracking-tight text-foreground">
              Cashbook
            </AppText>
            <AppText className="text-xs text-muted-foreground">
              Track personal debts, loans & repayments
            </AppText>
          </View>
        </View>

        {isLoading && (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}

        {error && (
          <View
            className="rounded-2xl border p-4"
            style={{
              backgroundColor: theme.destructiveSubtle || "#fee2e2",
              borderColor: theme.destructive,
            }}
          >
            <AppText className="text-xs text-destructive">{error.message}</AppText>
          </View>
        )}

        {/* Net Position Hero Card */}
        <Card variant="elevated" className="gap-3">
          <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Net Debt Position
          </AppText>

          <View className="flex-row items-center gap-2">
            <AppText
              className="text-3xl font-extrabold tracking-tight text-foreground"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {formatINR(Math.abs(netPosition))}
            </AppText>
            <View
              className="rounded-full px-2.5 py-0.5"
              style={{
                backgroundColor: isNetPositive
                  ? theme.successSubtle || "#dcfce7"
                  : theme.destructiveSubtle || "#fee2e2",
              }}
            >
              <AppText
                className="text-xs font-bold"
                style={{ color: isNetPositive ? theme.success : theme.destructive }}
              >
                {isNetPositive ? "You Will Receive" : "You Owe"}
              </AppText>
            </View>
          </View>

          <View
            className="flex-row items-center justify-between border-t pt-3"
            style={{
              borderTopColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
            }}
          >
            <View className="flex-row items-center gap-2">
              <View className="size-8 items-center justify-center rounded-full bg-success/15">
                <ArrowUpRight size={16} color={theme.success} />
              </View>
              <View>
                <AppText className="text-xs text-muted-foreground">Total Given</AppText>
                <AppText
                  className="text-sm font-semibold text-success mt-0.5"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatINR(totalGiven)}
                </AppText>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <View className="size-8 items-center justify-center rounded-full bg-destructive/15">
                <ArrowDownRight size={16} color={theme.destructive} />
              </View>
              <View className="items-end">
                <AppText className="text-xs text-muted-foreground">Total Received</AppText>
                <AppText
                  className="text-sm font-semibold text-destructive mt-0.5"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatINR(totalReceived)}
                </AppText>
              </View>
            </View>
          </View>
        </Card>

        {/* View Toggle */}
        <SegmentedControl
          options={[
            { value: "people", label: "By Person" },
            { value: "all", label: "All Records" },
          ]}
          value={activeTab}
          onChange={(val) => {
            setActiveTab(val as "people" | "all");
            setPage(0);
          }}
        />

        {/* People Summary Cards */}
        {activeTab === "people" && (
          <View className="gap-2.5">
            {!summary || Object.keys(summary).length === 0 ? (
              <View className="items-center justify-center p-8 gap-2">
                <AppText className="text-sm font-medium text-muted-foreground">
                  No counterparties logged
                </AppText>
                <AppText className="text-xs text-muted-foreground">
                  Tap '+' below to add an entry.
                </AppText>
              </View>
            ) : (
              Object.entries(summary).map(([name, data]) => (
                <CounterpartySummaryCard
                  key={name}
                  counterparty={name}
                  totalGiven={data.totalGiven}
                  totalReceived={data.totalReceived}
                  netBalance={data.netBalance}
                  hasOverdue={data.hasOverdue}
                />
              ))
            )}
          </View>
        )}

        {/* All Raw Entries List with Pagination */}
        {activeTab === "all" && (
          <View className="gap-2.5">
            {!entries || entries.length === 0 ? (
              <View className="items-center justify-center p-8 gap-2">
                <AppText className="text-sm font-medium text-muted-foreground">
                  No records yet
                </AppText>
              </View>
            ) : (
              <>
                {paginatedEntries.map((entry) => {
                  const itemData: CashbookListItemData = {
                    id: entry.id,
                    date: entry.date,
                    counterparty: entry.counterparty,
                    flow: entry.flow,
                    amount: entry.amount,
                    dueDate: entry.due_date ?? null,
                  };
                  return (
                    <CashbookListItem
                      key={entry.id}
                      entry={itemData}
                      onPress={() => {}}
                      onDelete={handleDelete}
                    />
                  );
                })}
                <PaginationControl
                  page={page}
                  pageSize={pageSize}
                  totalCount={totalEntriesCount}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[10, 25, 50, 100]}
                />
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Cashbook FAB */}
      <View className="absolute bottom-6 right-5">
        <Fab
          icon={<Plus size={24} color={theme.onPrimary} />}
          onPress={() => setShowAddSheet(true)}
        />
      </View>

      {/* Add Cashbook Sheet */}
      <AddCashbookSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        accounts={accounts ?? []}
        onSubmit={(data) => createCashbook(data)}
      />

      {/* React Native Delete Cashbook Confirmation Dialog */}
      <Dialog
        visible={!!deleteTargetId}
        title="Delete Cashbook Entry"
        description="Are you sure you want to delete this cashbook record? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          if (deleteTargetId) {
            deleteCashbook(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </SafeAreaView>
  );
}
