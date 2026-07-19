import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import {
  getFixedDeposits,
  getGold,
  getLoansLiabilities,
  getEpfAccounts,
  getNpsAccounts,
  getSsyAccounts,
  getSgbHoldings,
  getUlipPolicies,
  createFixedDeposit,
  createGold,
  createLoanLiability,
  createEpfAccount,
  createNpsAccount,
  createSsyAccount,
  createSgbHolding,
  createUlipPolicy,
  updateFixedDeposit,
  updateGold,
  updateLoanLiability,
  updateEpfAccount,
  updateNpsAccount,
  updateSsyAccount,
  updateSgbHolding,
  updateUlipPolicy,
  deleteFixedDeposit,
  deleteGold,
  deleteLoanLiability,
  deleteEpfAccount,
  deleteNpsAccount,
  deleteSsyAccount,
  deleteSgbHolding,
  deleteUlipPolicy,
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
} from '@repo/shared/schemas';

export function useFixedDeposits() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['fixedDeposits', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getFixedDeposits(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: AssetFixedDepositInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createFixedDeposit(supabase, userId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fixedDeposits', userId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetFixedDepositInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateFixedDeposit(supabase, userId, id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fixedDeposits', userId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteFixedDeposit(supabase, userId, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fixedDeposits', userId] }),
  });

  return {
    ...query,
    createFixedDeposit: createMutation.mutateAsync,
    updateFixedDeposit: updateMutation.mutateAsync,
    deleteFixedDeposit: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useGoldAssets() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['goldAssets', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getGold(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: AssetGoldInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createGold(supabase, userId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goldAssets', userId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetGoldInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateGold(supabase, userId, id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goldAssets', userId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteGold(supabase, userId, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goldAssets', userId] }),
  });

  return {
    ...query,
    createGold: createMutation.mutateAsync,
    updateGold: updateMutation.mutateAsync,
    deleteGold: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useLoanLiabilities() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['loanLiabilities', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getLoansLiabilities(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: AssetLoanLiabilityInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createLoanLiability(supabase, userId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loanLiabilities', userId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetLoanLiabilityInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateLoanLiability(supabase, userId, id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loanLiabilities', userId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteLoanLiability(supabase, userId, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loanLiabilities', userId] }),
  });

  return {
    ...query,
    createLoanLiability: createMutation.mutateAsync,
    updateLoanLiability: updateMutation.mutateAsync,
    deleteLoanLiability: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useEpfAccounts() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['epfAccounts', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getEpfAccounts(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: AssetEpfInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createEpfAccount(supabase, userId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['epfAccounts', userId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetEpfInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateEpfAccount(supabase, userId, id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['epfAccounts', userId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteEpfAccount(supabase, userId, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['epfAccounts', userId] }),
  });

  return {
    ...query,
    createEpfAccount: createMutation.mutateAsync,
    updateEpfAccount: updateMutation.mutateAsync,
    deleteEpfAccount: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useNpsAccounts() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['npsAccounts', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getNpsAccounts(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: AssetNpsInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createNpsAccount(supabase, userId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['npsAccounts', userId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetNpsInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateNpsAccount(supabase, userId, id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['npsAccounts', userId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteNpsAccount(supabase, userId, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['npsAccounts', userId] }),
  });

  return {
    ...query,
    createNpsAccount: createMutation.mutateAsync,
    updateNpsAccount: updateMutation.mutateAsync,
    deleteNpsAccount: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useSsyAccounts() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ssyAccounts', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getSsyAccounts(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: AssetSsyInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createSsyAccount(supabase, userId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ssyAccounts', userId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetSsyInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateSsyAccount(supabase, userId, id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ssyAccounts', userId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteSsyAccount(supabase, userId, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ssyAccounts', userId] }),
  });

  return {
    ...query,
    createSsyAccount: createMutation.mutateAsync,
    updateSsyAccount: updateMutation.mutateAsync,
    deleteSsyAccount: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useSgbHoldings() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sgbHoldings', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getSgbHoldings(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: AssetSgbInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createSgbHolding(supabase, userId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sgbHoldings', userId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetSgbInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateSgbHolding(supabase, userId, id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sgbHoldings', userId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteSgbHolding(supabase, userId, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sgbHoldings', userId] }),
  });

  return {
    ...query,
    createSgbHolding: createMutation.mutateAsync,
    updateSgbHolding: updateMutation.mutateAsync,
    deleteSgbHolding: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useUlipPolicies() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ulipPolicies', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getUlipPolicies(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: AssetUlipInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createUlipPolicy(supabase, userId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ulipPolicies', userId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetUlipInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateUlipPolicy(supabase, userId, id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ulipPolicies', userId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteUlipPolicy(supabase, userId, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ulipPolicies', userId] }),
  });

  return {
    ...query,
    createUlipPolicy: createMutation.mutateAsync,
    updateUlipPolicy: updateMutation.mutateAsync,
    deleteUlipPolicy: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
