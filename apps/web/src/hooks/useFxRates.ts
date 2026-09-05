import { useQuery } from '@tanstack/react-query';
import type { FxRates } from '@repo/shared/logic';

interface FxRatesResponse {
  base: string;
  rates: FxRates;
  fetchedAt: string;
  /** True when the provider was unreachable and this is the last successfully cached fetch,
   * not a fresh one — distinct from a hard failure so the UI can show "rates as of ..." rather
   * than either silently serving wrong-looking-fresh data or erroring for foreign-currency
   * users while INR-only users see nothing wrong at all. */
  stale: boolean;
}

/**
 * Live FX rates (base INR), refetched at most every 6 hours — daily-updated
 * rates don't justify refetching on every page visit. Not user-scoped, so this
 * is a plain fetch rather than going through useSupabaseClient/useAuth.
 */
export function useFxRates() {
  const query = useQuery({
    queryKey: ['fxRates'],
    queryFn: async (): Promise<FxRatesResponse> => {
      const res = await fetch('/api/fx-rates');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch FX rates');
      return data;
    },
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  // Empty object rather than undefined so every caller can pass this straight
  // into convertToBaseCurrency/sumInBaseCurrency without a loading branch —
  // INR conversions still work with no rates loaded; only foreign ones wait.
  return {
    rates: query.data?.rates ?? {},
    isLoading: query.isLoading,
    error: query.error,
    isStale: query.data?.stale ?? false,
    fetchedAt: query.data?.fetchedAt,
  };
}
