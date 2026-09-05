import { useQuery } from "@tanstack/react-query";
import type { FxRates } from "@repo/shared/logic";
import { FX_RATES_URL } from "@repo/shared/config";

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Live FX rates (base INR), refetched at most every 6 hours. Calls the rate provider
 * directly rather than going through apps/web's `/api/fx-rates` proxy — that route exists
 * on web only to keep the fetch server-side; it needs no API key and CORS doesn't apply to
 * a native app's fetch the way it does a browser's, so there's nothing the proxy adds here,
 * and calling it would make mobile FX conversion depend on the web deployment being up.
 * Not user-scoped, so this is a plain fetch rather than going through useSupabaseClient/useAuth.
 */
export function useFxRates() {
  const query = useQuery({
    queryKey: ["fxRates"],
    queryFn: async (): Promise<FxRates> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(FX_RATES_URL, { signal: controller.signal });
        const body = await res.json();
        if (!res.ok || body.result !== "success" || !body.rates) {
          throw new Error("Failed to fetch FX rates");
        }
        return body.rates as FxRates;
      } finally {
        clearTimeout(timer);
      }
    },
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  // Empty object rather than undefined so every caller can pass this straight into
  // convertToBaseCurrency/convertAccountBalancesToBase without a loading branch — INR
  // conversions still work with no rates loaded; only foreign ones wait.
  //
  // React Query already keeps the last successful `data` around when a background refetch
  // errors (it doesn't clear it) — so `isStale` here just means "the current data survived a
  // failed refetch," matching web's explicit stale-cache-fallback signal for the same reason:
  // let the UI say "rates as of ..." instead of silently showing numbers that look fresh but
  // aren't.
  const hasData = Object.keys(query.data ?? {}).length > 0;
  return {
    rates: query.data ?? {},
    isLoading: query.isLoading,
    error: query.error,
    isStale: query.isError && hasData,
    fetchedAt: query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toISOString() : undefined,
  };
}
