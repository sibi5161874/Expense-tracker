import { useQuery } from '@tanstack/react-query';
import { STALE_TIME_SIX_HOURS } from '@/lib/queryStaleTimes';

export interface LivePriceResult {
  ticker: string;
  price: number;
  currency: string;
}

/**
 * Live quote for any ticker via /api/live-price/universal — Pro-gated and 6-hour cached on
 * the server, so this is cheap to mount from anywhere without worrying about hammering
 * Yahoo. `staleTime` and `refetchInterval` both match the server's cache window: there's no
 * point refetching more often than the server would just hand back the same cached value.
 */
export function useLivePrice(ticker: string | null) {
  return useQuery({
    queryKey: ['live-price', ticker],
    queryFn: async (): Promise<LivePriceResult> => {
      const res = await fetch(`/api/live-price/universal?ticker=${encodeURIComponent(ticker!)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch price');
      return data as LivePriceResult;
    },
    enabled: !!ticker,
    staleTime: STALE_TIME_SIX_HOURS,
    refetchInterval: STALE_TIME_SIX_HOURS,
  });
}
