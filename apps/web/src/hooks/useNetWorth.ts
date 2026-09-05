import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useFxRates } from '@/hooks/useFxRates';
import type { NetWorthBreakdown } from '@repo/shared/logic';

interface NetWorthResponse {
  data: NetWorthBreakdown;
  unconvertedCurrencies: string[];
  cachedAt: string;
  cacheHit: boolean;
}

/**
 * Net worth for the dashboard hero — fetched from /api/dashboard/net-worth, a server route
 * that computes the same 15-asset-table aggregate this hook used to compose client-side (one
 * React Query hook per asset type, 15 separate Supabase round trips on every dashboard visit)
 * and caches the result server-side for CACHE_TTL_SECONDS. The 30s staleTime here matches
 * that server-side TTL, so this hook never presents data staler than it did before — it just
 * stops paying for a cold 15-query fan-out on every visit that gets a cache hit.
 *
 * fxRatesStale/fxRatesFetchedAt still come from useFxRates() directly — they describe the FX
 * cache's own staleness, not the net-worth number, and useFxRates() is already cheap/cached.
 */
export function useNetWorth() {
  const { user } = useAuth();
  const userId = user?.id;
  const { isStale: fxRatesStale, fetchedAt: fxRatesFetchedAt } = useFxRates();

  const query = useQuery({
    queryKey: ['netWorth', userId],
    queryFn: async (): Promise<NetWorthResponse> => {
      const res = await fetch('/api/dashboard/net-worth');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to load net worth');
      return body;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  return {
    data: query.data?.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    unconvertedCurrencies: query.data?.unconvertedCurrencies ?? [],
    fxRatesStale,
    fxRatesFetchedAt,
  };
}
