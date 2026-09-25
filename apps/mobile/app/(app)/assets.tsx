import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
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
import {
  assetFixedDepositSchema,
  assetGoldSchema,
  assetLoanLiabilitySchema,
  assetEpfSchema,
  assetNpsSchema,
  assetSsySchema,
  assetSgbSchema,
  assetUlipSchema,
  assetRealEstateSchema,
  assetPpfSchema,
  assetRecurringDepositSchema,
  assetNscSchema,
  assetVehicleSchema,
  assetCryptoSchema,
} from "@repo/shared/schemas";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { AppText } from "@/components/common/AppText";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { AssetForm } from "@/components/assets/AssetForm";
import { FixedDepositCard } from "@/components/assets/FixedDepositCard";
import { GoldCard } from "@/components/assets/GoldCard";
import { LoanCard } from "@/components/assets/LoanCard";
import { EpfCard } from "@/components/assets/EpfCard";
import { NpsCard } from "@/components/assets/NpsCard";
import { SsyCard } from "@/components/assets/SsyCard";
import { SgbCard } from "@/components/assets/SgbCard";
import { UlipCard } from "@/components/assets/UlipCard";
import { RealEstateCard } from "@/components/assets/RealEstateCard";
import { PpfCard } from "@/components/assets/PpfCard";
import { RecurringDepositCard } from "@/components/assets/RecurringDepositCard";
import { NscCard } from "@/components/assets/NscCard";
import { VehicleCard } from "@/components/assets/VehicleCard";
import { CryptoCard } from "@/components/assets/CryptoCard";
import { ASSET_TABS, type AssetTabKey } from "@/components/assets/assetTabs";
import {
  FD_FIELDS,
  GOLD_FIELDS,
  LOAN_FIELDS,
  EPF_FIELDS,
  NPS_FIELDS,
  SSY_FIELDS,
  SGB_FIELDS,
  ULIP_FIELDS,
  REAL_ESTATE_FIELDS,
  PPF_FIELDS,
  RECURRING_DEPOSIT_FIELDS,
  NSC_FIELDS,
  VEHICLE_FIELDS,
  CRYPTO_FIELDS,
} from "@/components/assets/assetFieldConfigs";

import { confirmAssetDelete, findEditingRow, submitAssetForm, toFormDefaults } from "@/components/assets/assetFormHelpers";
import { useThemeColor } from "@/lib/colors";

export default function AssetsScreen() {
  const [tab, setTab] = useState<AssetTabKey>("fd");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const primary = useThemeColor("primary");

  // Called unconditionally (Rules of Hooks) — each is a small config-table query, not one
  // of the two lists RULES.md §14 flags for growth (Transactions/Investment Log).
  const fd = useFixedDeposits();
  const gold = useGoldAssets();
  const loans = useLoanLiabilities();
  const epf = useEpfAccounts();
  const nps = useNpsAccounts();
  const ssy = useSsyAccounts();
  const sgb = useSgbHoldings();
  const ulip = useUlipPolicies();
  const realEstate = useRealEstate();
  const ppf = usePpfAccounts();
  const recurringDeposits = useRecurringDeposits();
  const nsc = useNscCertificates();
  const vehicles = useVehicles();
  const crypto = useCryptoAssets();

  function closeSheet() {
    setSheetOpen(false);
    setEditingId(null);
  }
  function openAdd() {
    setEditingId(null);
    setSheetOpen(true);
  }
  function openEdit(id: string) {
    setEditingId(id);
    setSheetOpen(true);
  }

  const isLoading = { fd, gold, loans, epf, nps, ssy, sgb, ulip, realEstate, ppf, recurringDeposits, nsc, vehicles, crypto }[tab]
    .isLoading;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader
          title="Assets"
          action={
            <Button onPress={openAdd}>
              <Plus size={16} color="white" />
              <AppText className="text-sm font-medium text-primary-foreground">Add</AppText>
            </Button>
          }
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <SegmentedControl
            options={ASSET_TABS.map((t) => ({ value: t.key, label: t.label }))}
            value={tab}
            onChange={(v) => setTab(v as AssetTabKey)}
          />
        </ScrollView>

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : (
          <View className="gap-3">
            {tab === "fd" && fd.data?.map((row) => <FixedDepositCard key={row.id} fd={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => fd.deleteFixedDeposit(id))} />)}
            {tab === "gold" && gold.data?.map((row) => <GoldCard key={row.id} gold={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => gold.deleteGold(id))} />)}
            {tab === "loans" && loans.data?.map((row) => <LoanCard key={row.id} loan={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => loans.deleteLoanLiability(id))} />)}
            {tab === "epf" && epf.data?.map((row) => <EpfCard key={row.id} epf={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => epf.deleteEpfAccount(id))} />)}
            {tab === "nps" && nps.data?.map((row) => <NpsCard key={row.id} nps={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => nps.deleteNpsAccount(id))} />)}
            {tab === "ssy" && ssy.data?.map((row) => <SsyCard key={row.id} ssy={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => ssy.deleteSsyAccount(id))} />)}
            {tab === "sgb" && sgb.data?.map((row) => <SgbCard key={row.id} sgb={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => sgb.deleteSgbHolding(id))} />)}
            {tab === "ulip" && ulip.data?.map((row) => <UlipCard key={row.id} ulip={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => ulip.deleteUlipPolicy(id))} />)}
            {tab === "realEstate" && realEstate.data?.map((row) => <RealEstateCard key={row.id} property={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => realEstate.deleteRealEstate(id))} />)}
            {tab === "ppf" && ppf.data?.map((row) => <PpfCard key={row.id} ppf={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => ppf.deletePpfAccount(id))} />)}
            {tab === "recurringDeposits" && recurringDeposits.data?.map((row) => <RecurringDepositCard key={row.id} rd={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => recurringDeposits.deleteRecurringDeposit(id))} />)}
            {tab === "nsc" && nsc.data?.map((row) => <NscCard key={row.id} nsc={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => nsc.deleteNscCertificate(id))} />)}
            {tab === "vehicles" && vehicles.data?.map((row) => <VehicleCard key={row.id} vehicle={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => vehicles.deleteVehicle(id))} />)}
            {tab === "crypto" && crypto.data?.map((row) => <CryptoCard key={row.id} crypto={row} onEdit={() => openEdit(row.id)} onDelete={(id) => confirmAssetDelete(() => crypto.deleteCryptoAsset(id))} />)}

            {({ fd, gold, loans, epf, nps, ssy, sgb, ulip, realEstate, ppf, recurringDeposits, nsc, vehicles, crypto }[tab].data
              ?.length ?? 0) === 0 && (
              <AppText className="py-8 text-center text-sm text-muted-foreground">
                No {ASSET_TABS.find((t) => t.key === tab)?.label.toLowerCase()} yet. Add your first one to get started.
              </AppText>
            )}
          </View>
        )}
      </ScrollView>

      {tab === "fd" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit Fixed Deposit" : "Add Fixed Deposit"} schema={assetFixedDepositSchema} fields={FD_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(fd.data, editingId), FD_FIELDS, { bank: "", principal: 0, maturity_value: 0, maturity_date: "", rate_pct: 0, withdrawn: false })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, fd.createFixedDeposit, fd.updateFixedDeposit, closeSheet)} />
      )}
      {tab === "gold" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit Gold" : "Add Gold"} schema={assetGoldSchema} fields={GOLD_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(gold.data, editingId), GOLD_FIELDS, { description: "", grams: 0, rate_per_gram: 0, purchase_value: 0 })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, gold.createGold, gold.updateGold, closeSheet)} />
      )}
      {tab === "loans" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit Loan" : "Add Loan"} schema={assetLoanLiabilitySchema} fields={LOAN_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(loans.data, editingId), LOAN_FIELDS, { lender: "", outstanding: 0 })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, loans.createLoanLiability, loans.updateLoanLiability, closeSheet)} />
      )}
      {tab === "epf" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit EPF" : "Add EPF"} schema={assetEpfSchema} fields={EPF_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(epf.data, editingId), EPF_FIELDS, { employer_name: "", current_balance: 0, monthly_contribution: 0 })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, epf.createEpfAccount, epf.updateEpfAccount, closeSheet)} />
      )}
      {tab === "nps" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit NPS" : "Add NPS"} schema={assetNpsSchema} fields={NPS_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(nps.data, editingId), NPS_FIELDS, { pran_number: "", current_value: 0, tier: "Tier I" as const })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, nps.createNpsAccount, nps.updateNpsAccount, closeSheet)} />
      )}
      {tab === "ssy" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit SSY" : "Add SSY"} schema={assetSsySchema} fields={SSY_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(ssy.data, editingId), SSY_FIELDS, { account_holder_name: "", account_number: "", current_balance: 0, opening_date: "" })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, ssy.createSsyAccount, ssy.updateSsyAccount, closeSheet)} />
      )}
      {tab === "sgb" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit SGB" : "Add SGB"} schema={assetSgbSchema} fields={SGB_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(sgb.data, editingId), SGB_FIELDS, { units_held: 0, issue_price: 0, issue_date: "", rate_per_gram: 0 })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, sgb.createSgbHolding, sgb.updateSgbHolding, closeSheet)} />
      )}
      {tab === "ulip" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit ULIP" : "Add ULIP"} schema={assetUlipSchema} fields={ULIP_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(ulip.data, editingId), ULIP_FIELDS, { insurer: "", policy_number: "", sum_assured: 0, current_fund_value: 0, premium_amount: 0, premium_frequency: "Yearly" as const, maturity_date: "" })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, ulip.createUlipPolicy, ulip.updateUlipPolicy, closeSheet)} />
      )}
      {tab === "realEstate" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit Real Estate" : "Add Real Estate"} schema={assetRealEstateSchema} fields={REAL_ESTATE_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(realEstate.data, editingId), REAL_ESTATE_FIELDS, { description: "", property_type: "Residential" as const, location: "", purchase_value: 0, current_value: 0, purchase_date: "" })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, realEstate.createRealEstate, realEstate.updateRealEstate, closeSheet)} />
      )}
      {tab === "ppf" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit PPF" : "Add PPF"} schema={assetPpfSchema} fields={PPF_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(ppf.data, editingId), PPF_FIELDS, { account_number: "", current_balance: 0, annual_contribution: 0, opening_date: "" })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, ppf.createPpfAccount, ppf.updatePpfAccount, closeSheet)} />
      )}
      {tab === "recurringDeposits" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit Recurring Deposit" : "Add Recurring Deposit"} schema={assetRecurringDepositSchema} fields={RECURRING_DEPOSIT_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(recurringDeposits.data, editingId), RECURRING_DEPOSIT_FIELDS, { bank: "", monthly_installment: 0, rate_pct: 0, start_date: "", maturity_date: "", maturity_value: 0 })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, recurringDeposits.createRecurringDeposit, recurringDeposits.updateRecurringDeposit, closeSheet)} />
      )}
      {tab === "nsc" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit NSC" : "Add NSC"} schema={assetNscSchema} fields={NSC_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(nsc.data, editingId), NSC_FIELDS, { certificate_number: "", purchase_value: 0, maturity_value: 0, rate_pct: 0, purchase_date: "", maturity_date: "" })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, nsc.createNscCertificate, nsc.updateNscCertificate, closeSheet)} />
      )}
      {tab === "vehicles" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit Vehicle" : "Add Vehicle"} schema={assetVehicleSchema} fields={VEHICLE_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(vehicles.data, editingId), VEHICLE_FIELDS, { description: "", vehicle_type: "Car" as const, registration_number: "", purchase_value: 0, current_value: 0, purchase_date: "" })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, vehicles.createVehicle, vehicles.updateVehicle, closeSheet)} />
      )}
      {tab === "crypto" && (
        <AssetForm visible={sheetOpen} title={editingId ? "Edit Crypto" : "Add Crypto"} schema={assetCryptoSchema} fields={CRYPTO_FIELDS}
          defaultValues={toFormDefaults(findEditingRow(crypto.data, editingId), CRYPTO_FIELDS, { symbol: "", name: "", quantity: 0, buy_price: 0, current_price: 0, wallet_or_exchange: "", purchase_date: new Date().toISOString().slice(0, 10), notes: "" })}
          onClose={closeSheet} onSubmit={(data) => submitAssetForm(editingId, data, crypto.createCryptoAsset, crypto.updateCryptoAsset, closeSheet)} />
      )}
    </SafeAreaView>
  );
}

