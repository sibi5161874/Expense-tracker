import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import {
  getCashbook,
  getCashbookSummary,
  createCashbook,
  createCashbookBulk,
  updateCashbook,
  deleteCashbook,
  deleteCashbookBulk,
} from '@repo/shared/queries/cashbook';
import type { CashbookInput } from '@repo/shared/schemas';

/** Removes rows with the given ids from every cached `['cashbook', userId, ...]` page —
 * shared by both the single and bulk delete mutations' optimistic update. */
function removeFromCashbookCache(old: unknown, ids: Set<string>) {
  return Array.isArray(old) ? old.filter((row) => !ids.has(row.id)) : old;
}

export function useCashbook(opts: { counterparty?: string; page?: number } = {}) {
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

  const createMutation = useMutation({
    mutationFn: (data: CashbookInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createCashbook(supabase, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashbook', userId] });
      queryClient.invalidateQueries({ queryKey: ['cashbookSummary', userId] });
    },
  });

  const createBulkMutation = useMutation({
    mutationFn: (rows: CashbookInput[]) => {
      if (!userId) throw new Error('User not authenticated');
      return createCashbookBulk(supabase, userId, rows);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashbook', userId] });
      queryClient.invalidateQueries({ queryKey: ['cashbookSummary', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CashbookInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateCashbook(supabase, userId, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashbook', userId] });
      queryClient.invalidateQueries({ queryKey: ['cashbookSummary', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteCashbook(supabase, userId, id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['cashbook', userId], exact: false });
      const previous = queryClient.getQueriesData({ queryKey: ['cashbook', userId], exact: false });
      const ids = new Set([id]);
      queryClient.setQueriesData({ queryKey: ['cashbook', userId], exact: false }, (old) =>
        removeFromCashbookCache(old, ids)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cashbook', userId] });
      queryClient.invalidateQueries({ queryKey: ['cashbookSummary', userId] });
    },
  });

  const deleteBulkMutation = useMutation({
    mutationFn: (ids: string[]) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteCashbookBulk(supabase, userId, ids);
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['cashbook', userId], exact: false });
      const previous = queryClient.getQueriesData({ queryKey: ['cashbook', userId], exact: false });
      const idSet = new Set(ids);
      queryClient.setQueriesData({ queryKey: ['cashbook', userId], exact: false }, (old) =>
        removeFromCashbookCache(old, idSet)
      );
      return { previous };
    },
    onError: (_err, _ids, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cashbook', userId] });
      queryClient.invalidateQueries({ queryKey: ['cashbookSummary', userId] });
    },
  });

  return {
    ...query,
    summary: summaryQuery.data,
    createCashbook: createMutation.mutateAsync,
    createCashbookBulk: createBulkMutation.mutateAsync,
    updateCashbook: updateMutation.mutateAsync,
    deleteCashbook: deleteMutation.mutate,
    deleteCashbookBulk: deleteBulkMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending || deleteBulkMutation.isPending,
  };
}
