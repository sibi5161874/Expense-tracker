import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getCashbook, getCashbookSummary, createCashbook, updateCashbook, deleteCashbook } from '@repo/shared/queries/cashbook';
import type { CashbookInput } from '@repo/shared/schemas';

/** Mirrors apps/web/src/hooks/useCashbook.ts. */
export function useCashbook(opts: { page?: number } = {}) {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['cashbook', userId, opts],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getCashbook(supabase, userId, opts);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const summaryQuery = useQuery({
    queryKey: ['cashbookSummary', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getCashbookSummary(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['cashbook', userId] });
    queryClient.invalidateQueries({ queryKey: ['cashbookSummary', userId] });
  }

  const createMutation = useMutation({
    mutationKey: ['createCashbook'],
    mutationFn: (data: CashbookInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createCashbook(supabase, userId, data);
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationKey: ['updateCashbook'],
    mutationFn: ({ id, data }: { id: string; data: Partial<CashbookInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateCashbook(supabase, userId, id, data);
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationKey: ['deleteCashbook'],
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteCashbook(supabase, userId, id);
    },
    onSuccess: invalidate,
  });

  return {
    ...query,
    summary: summaryQuery.data,
    createCashbook: createMutation.mutateAsync,
    updateCashbook: updateMutation.mutateAsync,
    deleteCashbook: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
