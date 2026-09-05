import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import {
  getNetWorthSnapshots,
  upsertNetWorthSnapshot,
  updateNetWorthSnapshot,
  deleteNetWorthSnapshot,
} from '@repo/shared/queries/netWorthSnapshots';
import type { NetWorthSnapshotInput } from '@repo/shared/schemas';

/** Mirrors apps/web/src/hooks/useNetWorthSnapshots.ts. */
export function useNetWorthSnapshots() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['netWorthSnapshots', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getNetWorthSnapshots(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const takeSnapshotMutation = useMutation({
    mutationFn: (data: NetWorthSnapshotInput) => {
      if (!userId) throw new Error('User not authenticated');
      return upsertNetWorthSnapshot(supabase, userId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['netWorthSnapshots', userId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NetWorthSnapshotInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateNetWorthSnapshot(supabase, userId, id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['netWorthSnapshots', userId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteNetWorthSnapshot(supabase, userId, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['netWorthSnapshots', userId] }),
  });

  return {
    ...query,
    takeSnapshot: takeSnapshotMutation.mutateAsync,
    updateSnapshot: updateMutation.mutateAsync,
    deleteSnapshot: deleteMutation.mutate,
    isTakingSnapshot: takeSnapshotMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
