import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import {
  getAccounts,
  getActiveAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from '@repo/shared/queries/config';
import type { AccountInput } from '@repo/shared/schemas';

export function useAccounts(activeOnly = false) {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['accounts', userId, activeOnly],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return activeOnly ? getActiveAccounts(supabase, userId) : getAccounts(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: AccountInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createAccount(supabase, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AccountInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateAccount(supabase, userId, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteAccount(supabase, userId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] });
    },
  });

  return {
    ...query,
    createAccount: createMutation.mutateAsync,
    updateAccount: updateMutation.mutateAsync,
    deleteAccount: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
