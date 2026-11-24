import { useState } from "react";
import { View, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, TrendingUp } from "lucide-react-native";
import { useInvestmentLog } from "@/hooks/useInvestmentLog";
import { useAccounts } from "@/hooks/useAccounts";
import { AppText } from "@/components/common/AppText";
import { Fab } from "@/components/common/Fab";
import { InvestmentLogListItem, type InvestmentLogListItemData } from "@/components/investments/InvestmentLogListItem";
import { AddInvestmentSheet } from "@/components/investments/AddInvestmentSheet";
import { useTheme } from "@/theme/ThemeProvider";

export default function InvestmentsScreen() {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);

  const { data: accounts } = useAccounts(true);
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    createInvestmentLog,
    deleteInvestmentLog,
  } = useInvestmentLog({ page });

  const logs = data ?? [];

  const handleDelete = (id: string) => {
    Alert.alert("Delete Trade", "Are you sure you want to remove this trade log?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteInvestmentLog(id) },
    ]);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <View className="px-4 pt-2 pb-3 gap-1 border-b border-outline-variant/20">
        <AppText className="text-2xl font-bold tracking-tight text-foreground">
          Investment Log
        </AppText>
        <AppText className="text-xs text-muted-foreground">
          {logs.length} trade transactions recorded
        </AppText>
      </View>

      {logs.length === 0 && !isLoading ? (
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
          data={logs}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 96 }}
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
        />
      )}

      {/* Floating Add Trade FAB */}
      <View className="absolute bottom-6 right-5">
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
    </SafeAreaView>
  );
}
