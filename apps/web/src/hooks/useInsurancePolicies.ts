import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import {
  getInsurancePolicies,
  createInsurancePolicy,
  updateInsurancePolicy,
  deleteInsurancePolicy,
} from '@repo/shared/queries/insurance';
import type { InsurancePolicyInput } from '@repo/shared/schemas';

export function useInsurancePolicies() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['insurancePolicies', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getInsurancePolicies(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: InsurancePolicyInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createInsurancePolicy(supabase, userId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insurancePolicies', userId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsurancePolicyInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateInsurancePolicy(supabase, userId, id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insurancePolicies', userId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteInsurancePolicy(supabase, userId, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insurancePolicies', userId] }),
  });

  return {
    ...query,
    createInsurancePolicy: createMutation.mutateAsync,
    updateInsurancePolicy: updateMutation.mutateAsync,
    deleteInsurancePolicy: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
