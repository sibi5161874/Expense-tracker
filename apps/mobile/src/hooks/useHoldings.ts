import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getHoldings } from '@repo/shared/queries/holdings';

/** Mirrors apps/web/src/hooks/useHoldings.ts. `holdings.live_price` is read-only from the
 * client — only the refresh-prices Edge Function writes it. */
export function useHoldings() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['holdings', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getHoldings(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}
