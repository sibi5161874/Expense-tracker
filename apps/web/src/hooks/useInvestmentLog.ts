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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentLog', userId] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
    },
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
