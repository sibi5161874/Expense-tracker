import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getCashbook, getCashbookSummary, createCashbook, updateCashbook, deleteCashbook } from '@repo/shared/queries/cashbook';
import type { CashbookInput } from '@repo/shared/schemas';
import { invalidateBalanceSensitiveQueries } from '@/lib/invalidateBalanceSensitiveQueries';

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
    invalidateBalanceSensitiveQueries(queryClient, userId);
  }

  const createMutation = useMutation({
    mutationKey: ['createCashbook'],
    mutationFn: (data: CashbookInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createCashbook(supabase, userId, data);
    },
    onMutate: async (newEntry: CashbookInput) => {
      await queryClient.cancelQueries({ queryKey: ['cashbook', userId] });
      const previousData = queryClient.getQueriesData({ queryKey: ['cashbook', userId] });

      const optimisticItem = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'open',
        ...newEntry,
      };

      queryClient.setQueriesData({ queryKey: ['cashbook', userId] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return [optimisticItem, ...old];
      });

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: invalidate,
  });

  const updateMutation = useMutation({
    mutationKey: ['updateCashbook'],
    mutationFn: ({ id, data }: { id: string; data: Partial<CashbookInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateCashbook(supabase, userId, id, data);
    },
    onMutate: async ({ id, data }: { id: string; data: Partial<CashbookInput> }) => {
      await queryClient.cancelQueries({ queryKey: ['cashbook', userId] });
      const previousData = queryClient.getQueriesData({ queryKey: ['cashbook', userId] });

      queryClient.setQueriesData({ queryKey: ['cashbook', userId] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: { id?: string }) => (item?.id === id ? { ...item, ...data } : item));
      });

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: invalidate,
  });

  const deleteMutation = useMutation({
    mutationKey: ['deleteCashbook'],
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteCashbook(supabase, userId, id);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['cashbook', userId] });
      const previousData = queryClient.getQueriesData({ queryKey: ['cashbook', userId] });

      queryClient.setQueriesData({ queryKey: ['cashbook', userId] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item: { id?: string }) => item?.id !== id);
      });

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: invalidate,
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
