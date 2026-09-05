import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAssetHookFactory } from "@repo/shared/hooks";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";

/**
 * Bound to this app's own auth/Supabase-client/react-query hooks — the actual factory
 * (caching, list/create/update/delete boilerplate) lives once in packages/shared/src/hooks
 * so it doesn't drift between web and mobile. See makeAssetHookFactory's own comment for
 * why the react-query hooks are injected rather than imported there.
 */
export const createAssetHook = makeAssetHookFactory({
  useAuth,
  useSupabaseClient,
  useQuery,
  useMutation,
  useQueryClient,
});

export type { AssetHookResult } from "@repo/shared/hooks";
