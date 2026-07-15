import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import {
  getFixedDeposits,
  getGold,
  getLoansLiabilities,
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
import type {
  AssetFixedDepositInput,
  AssetGoldInput,
  AssetLoanLiabilityInput,
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
