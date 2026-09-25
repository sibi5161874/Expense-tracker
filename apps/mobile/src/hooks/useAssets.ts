import {
  getFixedDeposits,
  getGold,
  getLoansLiabilities,
  getEpfAccounts,
  getNpsAccounts,
  getSsyAccounts,
  getSgbHoldings,
  getUlipPolicies,
  getRealEstate,
  getPpfAccounts,
  getRecurringDeposits,
  getNscCertificates,
  getVehicles,
  createFixedDeposit,
  createGold,
  createLoanLiability,
  createEpfAccount,
  createNpsAccount,
  createSsyAccount,
  createSgbHolding,
  createUlipPolicy,
  createRealEstate,
  createPpfAccount,
  createRecurringDeposit,
  createNscCertificate,
  createVehicle,
  updateFixedDeposit,
  updateGold,
  updateLoanLiability,
  updateEpfAccount,
  updateNpsAccount,
  updateSsyAccount,
  updateSgbHolding,
  updateUlipPolicy,
  updateRealEstate,
  updatePpfAccount,
  updateRecurringDeposit,
  updateNscCertificate,
  updateVehicle,
  deleteFixedDeposit,
  deleteGold,
  deleteLoanLiability,
  deleteEpfAccount,
  deleteNpsAccount,
  deleteSsyAccount,
  deleteSgbHolding,
  deleteUlipPolicy,
  deleteRealEstate,
  deletePpfAccount,
  deleteRecurringDeposit,
  deleteNscCertificate,
  deleteVehicle,
  getCryptoAssets,
  createCryptoAsset,
  updateCryptoAsset,
  deleteCryptoAsset,
} from '@repo/shared/queries/assets';
import type {
  AssetFixedDepositInput,
  AssetGoldInput,
  AssetLoanLiabilityInput,
  AssetEpfInput,
  AssetNpsInput,
  AssetSsyInput,
  AssetSgbInput,
  AssetUlipInput,
  AssetRealEstateInput,
  AssetPpfInput,
  AssetRecurringDepositInput,
  AssetNscInput,
  AssetVehicleInput,
  AssetCryptoInput,
} from '@repo/shared/schemas';
import type {
  FixedDeposit,
  GoldAsset,
  LoanLiability,
  EpfAsset,
  NpsAsset,
  SsyAsset,
  SgbAsset,
  UlipAsset,
  RealEstateAsset,
  PpfAsset,
  RecurringDepositAsset,
  NscAsset,
  VehicleAsset,
  CryptoAsset,
} from '@repo/shared/types';
import { createAssetHook } from '@/hooks/createAssetHook';

/**
 * One hook per asset table, all built from the same factory (see createAssetHook.ts,
 * which itself binds packages/shared/src/hooks/createAssetHook.ts to this app's own
 * auth/Supabase-client hooks). Each hook keeps its original named methods
 * (`createFixedDeposit`, `deleteGold`, ...) so every existing card/form call site keeps
 * working unchanged — only the internals moved into the shared factory.
 */

const useFixedDepositsBase = createAssetHook<FixedDeposit, AssetFixedDepositInput>({
  queryKey: 'fixedDeposits',
  list: getFixedDeposits,
  create: createFixedDeposit,
  update: updateFixedDeposit,
  remove: deleteFixedDeposit,
});

const useGoldAssetsBase = createAssetHook<GoldAsset, AssetGoldInput>({
  queryKey: 'goldAssets',
  list: getGold,
  create: createGold,
  update: updateGold,
  remove: deleteGold,
});

const useLoanLiabilitiesBase = createAssetHook<LoanLiability, AssetLoanLiabilityInput>({
  queryKey: 'loanLiabilities',
  list: getLoansLiabilities,
  create: createLoanLiability,
  update: updateLoanLiability,
  remove: deleteLoanLiability,
});

const useEpfAccountsBase = createAssetHook<EpfAsset, AssetEpfInput>({
  queryKey: 'epfAccounts',
  list: getEpfAccounts,
  create: createEpfAccount,
  update: updateEpfAccount,
  remove: deleteEpfAccount,
});

const useNpsAccountsBase = createAssetHook<NpsAsset, AssetNpsInput>({
  queryKey: 'npsAccounts',
  list: getNpsAccounts,
  create: createNpsAccount,
  update: updateNpsAccount,
  remove: deleteNpsAccount,
});

const useSsyAccountsBase = createAssetHook<SsyAsset, AssetSsyInput>({
  queryKey: 'ssyAccounts',
  list: getSsyAccounts,
  create: createSsyAccount,
  update: updateSsyAccount,
  remove: deleteSsyAccount,
});

const useSgbHoldingsBase = createAssetHook<SgbAsset, AssetSgbInput>({
  queryKey: 'sgbHoldings',
  list: getSgbHoldings,
  create: createSgbHolding,
  update: updateSgbHolding,
  remove: deleteSgbHolding,
});

const useUlipPoliciesBase = createAssetHook<UlipAsset, AssetUlipInput>({
  queryKey: 'ulipPolicies',
  list: getUlipPolicies,
  create: createUlipPolicy,
  update: updateUlipPolicy,
  remove: deleteUlipPolicy,
});

const useRealEstateBase = createAssetHook<RealEstateAsset, AssetRealEstateInput>({
  queryKey: 'realEstate',
  list: getRealEstate,
  create: createRealEstate,
  update: updateRealEstate,
  remove: deleteRealEstate,
});

const usePpfAccountsBase = createAssetHook<PpfAsset, AssetPpfInput>({
  queryKey: 'ppfAccounts',
  list: getPpfAccounts,
  create: createPpfAccount,
  update: updatePpfAccount,
  remove: deletePpfAccount,
});

const useRecurringDepositsBase = createAssetHook<RecurringDepositAsset, AssetRecurringDepositInput>({
  queryKey: 'recurringDeposits',
  list: getRecurringDeposits,
  create: createRecurringDeposit,
  update: updateRecurringDeposit,
  remove: deleteRecurringDeposit,
});

const useNscCertificatesBase = createAssetHook<NscAsset, AssetNscInput>({
  queryKey: 'nscCertificates',
  list: getNscCertificates,
  create: createNscCertificate,
  update: updateNscCertificate,
  remove: deleteNscCertificate,
});

const useVehiclesBase = createAssetHook<VehicleAsset, AssetVehicleInput>({
  queryKey: 'vehicles',
  list: getVehicles,
  create: createVehicle,
  update: updateVehicle,
  remove: deleteVehicle,
});

const useCryptoAssetsBase = createAssetHook<CryptoAsset, AssetCryptoInput>({
  queryKey: 'cryptoAssets',
  list: getCryptoAssets,
  create: createCryptoAsset,
  update: updateCryptoAsset,
  remove: deleteCryptoAsset,
});

export function useFixedDeposits() {
  const base = useFixedDepositsBase();
  return {
    ...base,
    createFixedDeposit: base.create,
    updateFixedDeposit: base.update,
    deleteFixedDeposit: base.remove,
  };
}

export function useGoldAssets() {
  const base = useGoldAssetsBase();
  return { ...base, createGold: base.create, updateGold: base.update, deleteGold: base.remove };
}

export function useLoanLiabilities() {
  const base = useLoanLiabilitiesBase();
  return {
    ...base,
    createLoanLiability: base.create,
    updateLoanLiability: base.update,
    deleteLoanLiability: base.remove,
  };
}

export function useEpfAccounts() {
  const base = useEpfAccountsBase();
  return { ...base, createEpfAccount: base.create, updateEpfAccount: base.update, deleteEpfAccount: base.remove };
}

export function useNpsAccounts() {
  const base = useNpsAccountsBase();
  return { ...base, createNpsAccount: base.create, updateNpsAccount: base.update, deleteNpsAccount: base.remove };
}

export function useSsyAccounts() {
  const base = useSsyAccountsBase();
  return { ...base, createSsyAccount: base.create, updateSsyAccount: base.update, deleteSsyAccount: base.remove };
}

export function useSgbHoldings() {
  const base = useSgbHoldingsBase();
  return { ...base, createSgbHolding: base.create, updateSgbHolding: base.update, deleteSgbHolding: base.remove };
}

export function useUlipPolicies() {
  const base = useUlipPoliciesBase();
  return { ...base, createUlipPolicy: base.create, updateUlipPolicy: base.update, deleteUlipPolicy: base.remove };
}

export function useRealEstate() {
  const base = useRealEstateBase();
  return { ...base, createRealEstate: base.create, updateRealEstate: base.update, deleteRealEstate: base.remove };
}

export function usePpfAccounts() {
  const base = usePpfAccountsBase();
  return { ...base, createPpfAccount: base.create, updatePpfAccount: base.update, deletePpfAccount: base.remove };
}

export function useRecurringDeposits() {
  const base = useRecurringDepositsBase();
  return {
    ...base,
    createRecurringDeposit: base.create,
    updateRecurringDeposit: base.update,
    deleteRecurringDeposit: base.remove,
  };
}

export function useNscCertificates() {
  const base = useNscCertificatesBase();
  return {
    ...base,
    createNscCertificate: base.create,
    updateNscCertificate: base.update,
    deleteNscCertificate: base.remove,
  };
}

export function useVehicles() {
  const base = useVehiclesBase();
  return { ...base, createVehicle: base.create, updateVehicle: base.update, deleteVehicle: base.remove };
}

export function useCryptoAssets() {
  const base = useCryptoAssetsBase();
  return { ...base, createCryptoAsset: base.create, updateCryptoAsset: base.update, deleteCryptoAsset: base.remove };
}

