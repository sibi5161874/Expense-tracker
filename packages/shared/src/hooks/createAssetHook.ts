import type { useQuery, useMutation, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "../types";

type Client = SupabaseClient<Database>;

interface AssetQueries<TRow, TInput> {
  /** TanStack Query key prefix — the userId is appended automatically. */
  queryKey: string;
  list: (supabase: Client, userId: string) => Promise<TRow[]>;
  create: (supabase: Client, userId: string, data: TInput) => Promise<TRow>;
  update: (supabase: Client, userId: string, id: string, data: Partial<TInput>) => Promise<TRow>;
  remove: (supabase: Client, userId: string, id: string) => Promise<void>;
}

export interface AssetHookResult<TRow, TInput> extends Omit<UseQueryResult<TRow[], Error>, "refetch"> {
  create: (data: TInput) => Promise<TRow>;
  update: (args: { id: string; data: Partial<TInput> }) => Promise<TRow>;
  remove: (id: string) => void;
  isCreating: boolean;
  isDeleting: boolean;
}

interface AssetHookDeps {
  useAuth: () => { user: User | null };
  useSupabaseClient: () => Client;
  /**
   * Passed in rather than imported here on purpose. apps/web and apps/mobile pin different
   * React patch versions (Expo SDK 57 requires react 19.2.3; web is on 19.2.4), so pnpm
   * installs two physically separate copies of @tanstack/react-query — one per React
   * version. If this file imported react-query directly it would bind to whichever copy
   * resolves for `packages/shared`, and the hook would then look for a QueryClient in a
   * *different* React context than the one the app's own QueryClientProvider populated —
   * failing at runtime with "No QueryClient set" even though the provider is mounted.
   * Injecting each app's own hooks keeps every call on one instance.
   */
  useQuery: typeof useQuery;
  useMutation: typeof useMutation;
  useQueryClient: typeof useQueryClient;
}

/**
 * Builds a `createAssetHook` factory bound to one app's own auth/Supabase-client/react-query
 * hooks.
 *
 * The factory itself (list/create/update/delete + caching) is identical on web and
 * mobile — what differs per app is *where* `user`, the Supabase client, and the react-query
 * hooks come from. Each app supplies its own set once:
 *
 *   // apps/web/src/hooks/createAssetHook.ts
 *   export const createAssetHook = makeAssetHookFactory({
 *     useAuth, useSupabaseClient, useQuery, useMutation, useQueryClient,
 *   });
 *
 * so the ~500 duplicated lines this used to be (13 asset types × ~50 lines of identical
 * useQuery/useMutation boilerplate, once per app) live in exactly one place.
 *
 * Caching: 5-minute staleTime (assets change rarely), every mutation invalidates only its
 * own key.
 */
export function makeAssetHookFactory({
  useAuth,
  useSupabaseClient,
  useQuery,
  useMutation,
  useQueryClient,
}: AssetHookDeps) {
  return function createAssetHook<TRow extends { id: string }, TInput>(queries: AssetQueries<TRow, TInput>) {
    return function useAsset(): AssetHookResult<TRow, TInput> {
      const { user } = useAuth();
      const userId = user?.id;
      const supabase = useSupabaseClient();
      const queryClient = useQueryClient();
      const key = [queries.queryKey, userId];

      const query = useQuery({
        queryKey: key,
        queryFn: () => {
          if (!userId) throw new Error("User not authenticated");
          return queries.list(supabase, userId);
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
      });

      const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

      const createMutation = useMutation({
        mutationFn: (data: TInput) => {
          if (!userId) throw new Error("User not authenticated");
          return queries.create(supabase, userId, data);
        },
        onSuccess: invalidate,
      });

      const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<TInput> }) => {
          if (!userId) throw new Error("User not authenticated");
          return queries.update(supabase, userId, id, data);
        },
        onSuccess: invalidate,
      });

      const deleteMutation = useMutation({
        mutationFn: (id: string) => {
          if (!userId) throw new Error("User not authenticated");
          return queries.remove(supabase, userId, id);
        },
        // Optimistic removal — the row disappears immediately instead of waiting for the
        // round trip, rolling back automatically if the delete fails. One implementation
        // here covers all 13 asset types on both apps, since this factory is the only place
        // any of them define their mutations.
        onMutate: async (id) => {
          await queryClient.cancelQueries({ queryKey: key });
          const previous = queryClient.getQueryData<TRow[]>(key);
          queryClient.setQueryData<TRow[]>(key, (old) => old?.filter((row) => row.id !== id));
          return { previous };
        },
        onError: (_err, _id, context) => {
          if (context?.previous) queryClient.setQueryData(key, context.previous);
        },
        onSettled: invalidate,
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
  };
}
