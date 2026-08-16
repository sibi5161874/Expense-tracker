import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getGoals, createGoal, updateGoal, deleteGoal } from '@repo/shared/queries/goals';
import type { GoalInput } from '@repo/shared/schemas';

/** Mirrors apps/web/src/hooks/useGoals.ts. */
export function useGoals() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['goals', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getGoals(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['goals', userId] });
  }

  const createMutation = useMutation({
    mutationKey: ['createGoal'],
    mutationFn: (data: GoalInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createGoal(supabase, userId, data);
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationKey: ['updateGoal'],
    mutationFn: ({ id, data }: { id: string; data: Partial<GoalInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateGoal(supabase, userId, id, data);
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationKey: ['deleteGoal'],
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteGoal(supabase, userId, id);
    },
    onSuccess: invalidate,
  });

  return {
    ...query,
    createGoal: createMutation.mutateAsync,
    updateGoal: updateMutation.mutateAsync,
    deleteGoal: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
