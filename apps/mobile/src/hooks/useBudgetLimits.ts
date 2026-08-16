import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getBudgetLimits, createBudgetLimit, updateBudgetLimit, deleteBudgetLimit } from '@repo/shared/queries/budgetLimits';
import type { BudgetLimitInput } from '@repo/shared/schemas';

/** Mirrors apps/web/src/hooks/useBudgetLimits.ts. */
export function useBudgetLimits() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['budgetLimits', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getBudgetLimits(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['budgetLimits', userId] });
  }

  const createMutation = useMutation({
    mutationFn: (data: BudgetLimitInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createBudgetLimit(supabase, userId, data);
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetLimitInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateBudgetLimit(supabase, userId, id, data);
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteBudgetLimit(supabase, userId, id);
    },
    onSuccess: invalidate,
  });

  return {
    ...query,
    createBudgetLimit: createMutation.mutateAsync,
    updateBudgetLimit: updateMutation.mutateAsync,
    deleteBudgetLimit: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
