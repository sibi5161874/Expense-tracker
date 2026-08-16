import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/shared/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';

type Client = SupabaseClient<Database>;

interface AssetQueries<TRow, TInput> {
  /** TanStack Query key prefix — the userId is appended automatically. */
  queryKey: string;
  list: (supabase: Client, userId: string) => Promise<TRow[]>;
  create: (supabase: Client, userId: string, data: TInput) => Promise<TRow>;
  update: (supabase: Client, userId: string, id: string, data: Partial<TInput>) => Promise<TRow>;
  remove: (supabase: Client, userId: string, id: string) => Promise<void>;
}

export interface AssetHookResult<TRow, TInput> extends Omit<UseQueryResult<TRow[], Error>, 'refetch'> {
  create: (data: TInput) => Promise<TRow>;
  update: (args: { id: string; data: Partial<TInput> }) => Promise<TRow>;
  remove: (id: string) => void;
  isCreating: boolean;
  isDeleting: boolean;
}

/**
 * Builds a standard list/create/update/delete hook for one asset table.
 *
 * Every asset type's hook was previously ~50 lines of identical
 * useQuery/useMutation boilerplate differing only in the query key and the four
 * query functions — 10 asset types meant ~500 duplicated lines that all had to
 * be edited in lockstep whenever the caching or auth pattern changed. This
 * factory holds that pattern once; adding an asset type is now a 6-line call.
 *
 * Caching matches the previous per-hook behaviour exactly: 5-minute staleTime
 * (assets change rarely), and every mutation invalidates only its own key.
 */
export function createAssetHook<TRow, TInput>(queries: AssetQueries<TRow, TInput>) {
  return function useAsset(): AssetHookResult<TRow, TInput> {
    const { user } = useAuth();
    const userId = user?.id;
    const supabase = useSupabaseClient();
    const queryClient = useQueryClient();
    const key = [queries.queryKey, userId];

    const query = useQuery({
      queryKey: key,
      queryFn: () => {
        if (!userId) throw new Error('User not authenticated');
        return queries.list(supabase, userId);
      },
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

    const createMutation = useMutation({
      mutationFn: (data: TInput) => {
        if (!userId) throw new Error('User not authenticated');
        return queries.create(supabase, userId, data);
      },
      onSuccess: invalidate,
    });

    const updateMutation = useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<TInput> }) => {
        if (!userId) throw new Error('User not authenticated');
        return queries.update(supabase, userId, id, data);
      },
      onSuccess: invalidate,
    });

    const deleteMutation = useMutation({
      mutationFn: (id: string) => {
        if (!userId) throw new Error('User not authenticated');
        return queries.remove(supabase, userId, id);
      },
      onSuccess: invalidate,
    });

    return {
      ...query,
      create: createMutation.mutateAsync,
      update: updateMutation.mutateAsync,
      remove: deleteMutation.mutate,
      isCreating: createMutation.isPending,
      isDeleting: deleteMutation.isPending,
    } as AssetHookResult<TRow, TInput>;
  };
}
