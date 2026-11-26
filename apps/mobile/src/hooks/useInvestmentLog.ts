import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import {
  getInvestmentLog,
  getAllInvestmentLog,
  createInvestmentLog,
  updateInvestmentLog,
  deleteInvestmentLog,
} from '@repo/shared/queries/investmentLog';
import type { InvestmentLogInput } from '@repo/shared/schemas';
import { invalidateBalanceSensitiveQueries } from '@/lib/invalidateBalanceSensitiveQueries';

/** Mirrors apps/web/src/hooks/useInvestmentLog.ts. */
export function useInvestmentLog(opts: { page?: number; pageSize?: number } = {}) {
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

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['investmentLog', userId] });
    queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
    invalidateBalanceSensitiveQueries(queryClient, userId);
  }

  const createMutation = useMutation({
    mutationKey: ['createInvestmentLog'],
    mutationFn: (data: InvestmentLogInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createInvestmentLog(supabase, userId, data);
    },
    onMutate: async (newEntry: InvestmentLogInput) => {
      await queryClient.cancelQueries({ queryKey: ['investmentLog', userId] });
      await queryClient.cancelQueries({ queryKey: ['allInvestmentLog', userId] });
      const prevLog = queryClient.getQueriesData({ queryKey: ['investmentLog', userId] });
      const prevAll = queryClient.getQueriesData({ queryKey: ['allInvestmentLog', userId] });

      const optimisticItem = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...newEntry,
      };

      queryClient.setQueriesData({ queryKey: ['investmentLog', userId] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return [optimisticItem, ...old];
      });
      queryClient.setQueriesData({ queryKey: ['allInvestmentLog', userId] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return [optimisticItem, ...old];
      });

      return { prevLog, prevAll };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevLog) {
        context.prevLog.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      if (context?.prevAll) {
        context.prevAll.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
    },
    onSettled: invalidate,
  });

  const updateMutation = useMutation({
    mutationKey: ['updateInvestmentLog'],
    mutationFn: ({ id, data }: { id: string; data: Partial<InvestmentLogInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateInvestmentLog(supabase, userId, id, data);
    },
    onMutate: async ({ id, data }: { id: string; data: Partial<InvestmentLogInput> }) => {
      await queryClient.cancelQueries({ queryKey: ['investmentLog', userId] });
      await queryClient.cancelQueries({ queryKey: ['allInvestmentLog', userId] });
      const prevLog = queryClient.getQueriesData({ queryKey: ['investmentLog', userId] });
      const prevAll = queryClient.getQueriesData({ queryKey: ['allInvestmentLog', userId] });

      queryClient.setQueriesData({ queryKey: ['investmentLog', userId] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: { id?: string }) => (item?.id === id ? { ...item, ...data } : item));
      });
      queryClient.setQueriesData({ queryKey: ['allInvestmentLog', userId] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: { id?: string }) => (item?.id === id ? { ...item, ...data } : item));
      });

      return { prevLog, prevAll };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevLog) {
        context.prevLog.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      if (context?.prevAll) {
        context.prevAll.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
    },
    onSettled: invalidate,
  });

  const deleteMutation = useMutation({
    mutationKey: ['deleteInvestmentLog'],
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteInvestmentLog(supabase, userId, id);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['investmentLog', userId] });
      await queryClient.cancelQueries({ queryKey: ['allInvestmentLog', userId] });
      const prevLog = queryClient.getQueriesData({ queryKey: ['investmentLog', userId] });
      const prevAll = queryClient.getQueriesData({ queryKey: ['allInvestmentLog', userId] });

      queryClient.setQueriesData({ queryKey: ['investmentLog', userId] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item: { id?: string }) => item?.id !== id);
      });
      queryClient.setQueriesData({ queryKey: ['allInvestmentLog', userId] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item: { id?: string }) => item?.id !== id);
      });

      return { prevLog, prevAll };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevLog) {
        context.prevLog.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      if (context?.prevAll) {
        context.prevAll.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
    },
    onSettled: invalidate,
  });

  return {
    ...query,
    createInvestmentLog: createMutation.mutateAsync,
    updateInvestmentLog: updateMutation.mutateAsync,
    deleteInvestmentLog: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
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
