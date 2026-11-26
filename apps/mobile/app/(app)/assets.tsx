import { useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trash2, Layers } from "lucide-react-native";
import {
  useFixedDeposits,
  useGoldAssets,
  useLoanLiabilities,
  useEpfAccounts,
  useNpsAccounts,
  useSsyAccounts,
  useSgbHoldings,
  useUlipPolicies,
  useRealEstate,
  usePpfAccounts,
  useRecurringDeposits,
  useNscCertificates,
  useVehicles,
  useCryptoAssets,
} from "@/hooks/useAssets";

import { AppText } from "@/components/common/AppText";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { Chip } from "@/components/common/Chip";
import { AmountText } from "@/components/common/AmountText";
import { useTheme } from "@/theme/ThemeProvider";

const ASSET_TYPES = [
  "Fixed Deposits",
  "Gold",
  "Loans & Liabilities",
  "EPF",
  "PPF",
  "NPS",
  "SGB",
  "Real Estate",
  "Crypto",
  "Recurring Deposits",
  "Vehicles",
  "SSY",
  "ULIP",
  "NSC",
] as const;

type AssetType = typeof ASSET_TYPES[number];

interface GenericAssetRecord {
  id: string;
  bank_name?: string;
  name?: string;
  property_name?: string;
  symbol?: string;
  insurer?: string;
  account_number?: string;
  policy_number?: string;
  registration_number?: string;
  current_balance?: number;
  current_value?: number;
  principal_amount?: number;
  amount?: number;
}

export default function AssetsScreen() {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState<AssetType>("Fixed Deposits");

  const fd = useFixedDeposits();
  const gold = useGoldAssets();
  const loan = useLoanLiabilities();
  const epf = useEpfAccounts();
  const ppf = usePpfAccounts();
  const nps = useNpsAccounts();
  const sgb = useSgbHoldings();
  const re = useRealEstate();
  const crypto = useCryptoAssets();
  const rd = useRecurringDeposits();
  const veh = useVehicles();
  const ssy = useSsyAccounts();
  const ulip = useUlipPolicies();
  const nsc = useNscCertificates();

  function getCurrentData(): { data: GenericAssetRecord[]; isLoading: boolean; deleteId: (id: string) => void } {
    switch (selectedType) {
      case "Fixed Deposits":
        return { data: (fd.data ?? []) as GenericAssetRecord[], isLoading: fd.isLoading, deleteId: (id) => fd.deleteFixedDeposit(id) };
      case "Gold":
        return { data: (gold.data ?? []) as GenericAssetRecord[], isLoading: gold.isLoading, deleteId: (id) => gold.deleteGold(id) };
      case "Loans & Liabilities":
        return { data: (loan.data ?? []) as GenericAssetRecord[], isLoading: loan.isLoading, deleteId: (id) => loan.deleteLoanLiability(id) };
      case "EPF":
        return { data: (epf.data ?? []) as GenericAssetRecord[], isLoading: epf.isLoading, deleteId: (id) => epf.deleteEpfAccount(id) };
      case "PPF":
        return { data: (ppf.data ?? []) as GenericAssetRecord[], isLoading: ppf.isLoading, deleteId: (id) => ppf.deletePpfAccount(id) };
      case "NPS":
        return { data: (nps.data ?? []) as GenericAssetRecord[], isLoading: nps.isLoading, deleteId: (id) => nps.deleteNpsAccount(id) };
      case "SGB":
        return { data: (sgb.data ?? []) as GenericAssetRecord[], isLoading: sgb.isLoading, deleteId: (id) => sgb.deleteSgbHolding(id) };
      case "Real Estate":
        return { data: (re.data ?? []) as GenericAssetRecord[], isLoading: re.isLoading, deleteId: (id) => re.deleteRealEstate(id) };
      case "Crypto":
        return { data: (crypto.data ?? []) as GenericAssetRecord[], isLoading: crypto.isLoading, deleteId: (id) => crypto.deleteCryptoAsset(id) };
      case "Recurring Deposits":
        return { data: (rd.data ?? []) as GenericAssetRecord[], isLoading: rd.isLoading, deleteId: (id) => rd.deleteRecurringDeposit(id) };
      case "Vehicles":
        return { data: (veh.data ?? []) as GenericAssetRecord[], isLoading: veh.isLoading, deleteId: (id) => veh.deleteVehicle(id) };
      case "SSY":
        return { data: (ssy.data ?? []) as GenericAssetRecord[], isLoading: ssy.isLoading, deleteId: (id) => ssy.deleteSsyAccount(id) };
      case "ULIP":
        return { data: (ulip.data ?? []) as GenericAssetRecord[], isLoading: ulip.isLoading, deleteId: (id) => ulip.deleteUlipPolicy(id) };
      case "NSC":
        return { data: (nsc.data ?? []) as GenericAssetRecord[], isLoading: nsc.isLoading, deleteId: (id) => nsc.deleteNscCertificate(id) };
    }
  }

  const { data: list, isLoading, deleteId } = getCurrentData();

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Delete this asset record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteId(id) },
    ]);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader showBack />
      {/* Header */}
      <View className="px-4 pt-2 pb-3 gap-3">
        <View>
          <AppText className="text-2xl font-bold tracking-tight text-foreground">
            Assets & Liabilities
          </AppText>
          <AppText className="text-xs text-muted-foreground">
            Track 14 Indian wealth categories & debt instruments
          </AppText>
        </View>

        {/* M3 Asset Class Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row items-center gap-2">
            {ASSET_TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                selected={selectedType === type}
                onPress={() => setSelectedType(type)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Asset Content */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 96,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between px-1">
          <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {selectedType} ({list.length})
          </AppText>
        </View>

        {isLoading && (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}

        {list.length === 0 && !isLoading && (
          <View className="items-center justify-center p-8 gap-2">
            <View
              className="size-14 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.surfaceContainerHighest }}
            >
              <Layers size={24} color={theme.mutedForeground} />
            </View>
            <AppText className="text-sm font-medium text-muted-foreground">
              No records found for {selectedType}
            </AppText>
          </View>
        )}

        {list.map((item) => {
          const title =
            item.bank_name ||
            item.name ||
            item.property_name ||
            item.symbol ||
            item.insurer ||
            "Asset Record";
          const subtitle =
            item.account_number ||
            item.policy_number ||
            item.registration_number ||
            "";
          const val = Number(
            item.current_balance ||
              item.current_value ||
              item.principal_amount ||
              item.amount ||
              0
          );

          return (
            <Card
              key={item.id}
              variant="outlined"
              className="flex-row items-center justify-between py-3.5"
            >
              <View className="flex-1 gap-0.5">
                <AppText className="text-sm font-bold text-foreground">{title}</AppText>
                {subtitle ? (
                  <AppText className="text-xs text-muted-foreground">{subtitle}</AppText>
                ) : null}
              </View>

              <View className="items-end gap-1.5">
                <AmountText
                  value={val}
                  colorBySign={false}
                  className="text-sm font-bold text-foreground"
                />
                <Pressable
                  onPress={() => handleDelete(item.id)}
                  hitSlop={8}
                  className="flex-row items-center gap-1"
                >
                  <Trash2 size={13} color={theme.destructive} />
                  <AppText className="text-xs font-medium text-destructive">Delete</AppText>
                </Pressable>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
