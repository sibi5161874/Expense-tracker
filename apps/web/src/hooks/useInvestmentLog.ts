import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import {
  getInvestmentLog,
  getAllInvestmentLog,
  createInvestmentLog,
  createInvestmentLogsBulk,
  updateInvestmentLog,
  deleteInvestmentLog,
  deleteInvestmentLogBulk,
} from '@repo/shared/queries/investmentLog';
import type { InvestmentLogInput } from '@repo/shared/schemas';

/** Removes rows with the given ids from every cached `['investmentLog', userId, ...]` page —
 * shared by both the single and bulk delete mutations' optimistic update. */
function removeFromInvestmentLogCache(old: unknown, ids: Set<string>) {
  return Array.isArray(old) ? old.filter((row) => !ids.has(row.id)) : old;
}

export function useInvestmentLog(opts: { symbol?: string; page?: number } = {}) {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['investmentLog', userId, opts],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getInvestmentLog(supabase, userId, opts);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: InvestmentLogInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createInvestmentLog(supabase, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentLog', userId] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
    },
  });

  const createBulkMutation = useMutation({
    mutationFn: (rows: InvestmentLogInput[]) => {
      if (!userId) throw new Error('User not authenticated');
      return createInvestmentLogsBulk(supabase, userId, rows);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentLog', userId] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvestmentLogInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateInvestmentLog(supabase, userId, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentLog', userId] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteInvestmentLog(supabase, userId, id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['investmentLog', userId], exact: false });
      const previous = queryClient.getQueriesData({ queryKey: ['investmentLog', userId], exact: false });
      const ids = new Set([id]);
      queryClient.setQueriesData({ queryKey: ['investmentLog', userId], exact: false }, (old) =>
        removeFromInvestmentLogCache(old, ids)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentLog', userId] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
    },
  });

  const deleteBulkMutation = useMutation({
    mutationFn: (ids: string[]) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteInvestmentLogBulk(supabase, userId, ids);
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['investmentLog', userId], exact: false });
      const previous = queryClient.getQueriesData({ queryKey: ['investmentLog', userId], exact: false });
      const idSet = new Set(ids);
      queryClient.setQueriesData({ queryKey: ['investmentLog', userId], exact: false }, (old) =>
        removeFromInvestmentLogCache(old, idSet)
      );
      return { previous };
    },
    onError: (_err, _ids, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentLog', userId] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
    },
  });

  return {
    ...query,
    createInvestmentLog: createMutation.mutateAsync,
    createInvestmentLogsBulk: createBulkMutation.mutateAsync,
    updateInvestmentLog: updateMutation.mutateAsync,
    deleteInvestmentLog: deleteMutation.mutate,
    deleteInvestmentLogBulk: deleteBulkMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending || deleteBulkMutation.isPending,
  };
}

/** Unpaginated fetch for portfolio aggregation — never render this as a list. */
export function useAllInvestmentLog() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['allInvestmentLog', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getAllInvestmentLog(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}
