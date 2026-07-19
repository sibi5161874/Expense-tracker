import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getUserProfile, upsertUserProfile } from '@repo/shared/queries/profile';
import type { UserProfileInput } from '@repo/shared/schemas';

export function useUserProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getUserProfile(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<UserProfileInput>) => {
      if (!userId) throw new Error('User not authenticated');
      return upsertUserProfile(supabase, userId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfile', userId] }),
  });

  return {
    ...query,
    saveProfile: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
