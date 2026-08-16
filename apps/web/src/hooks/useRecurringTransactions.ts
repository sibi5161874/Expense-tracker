import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from '@repo/shared/queries/recurringTransactions';
import type { RecurringTransactionInput } from '@repo/shared/schemas';

export function useRecurringTransactions() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['recurringTransactions', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getRecurringTransactions(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: RecurringTransactionInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createRecurringTransaction(supabase, userId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringTransactions', userId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringTransactionInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateRecurringTransaction(supabase, userId, id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringTransactions', userId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteRecurringTransaction(supabase, userId, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringTransactions', userId] }),
  });

  return {
    ...query,
    createRecurringTransaction: createMutation.mutateAsync,
    updateRecurringTransaction: updateMutation.mutateAsync,
    deleteRecurringTransaction: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
