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
  updateFixedDeposit,
  updateGold,
  updateLoanLiability,
  deleteFixedDeposit,
  deleteGold,
  deleteLoanLiability,
} from '@repo/shared/queries/assets';
import type { AssetFixedDepositInput, AssetGoldInput, AssetLoanLiabilityInput } from '@repo/shared/schemas';

/** Mirrors apps/web/src/hooks/useAssets.ts. */
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

// Read-only for now — mobile has no Assets screen yet (web-only per this pass), these exist
// solely so useNetWorth.ts stays correct/consistent with web's net worth total. Add the
// mutation half here when a mobile Assets screen gets built.

export function useEpfAccounts() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['epfAccounts', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getEpfAccounts(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useNpsAccounts() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['npsAccounts', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getNpsAccounts(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSsyAccounts() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['ssyAccounts', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getSsyAccounts(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSgbHoldings() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['sgbHoldings', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getSgbHoldings(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUlipPolicies() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['ulipPolicies', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getUlipPolicies(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
