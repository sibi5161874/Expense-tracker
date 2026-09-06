import { useQuery } from '@tanstack/react-query';
import type { StockFundamentals } from '@repo/shared/logic';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/** Fundamentals (P/E, 52-week range, margins, market cap, beta, dividend yield) for one ticker via /api/stock/fundamentals — Pro-gated and cached server-side, so this is cheap to mount from a detail page or a per-holding loop alike. `exchange` (NSE/BSE/blank for non-Indian listings) lets the route build the correctly-suffixed Yahoo ticker (.NS/.BO) itself — Yahoo can't resolve most Indian symbols unsuffixed. */
export function useStockFundamentals(ticker: string | null, exchange: string | null) {
  return useQuery({
    queryKey: ['stock-fundamentals', ticker, exchange],
    queryFn: async (): Promise<StockFundamentals & { ticker: string }> => {
      const params = new URLSearchParams({ ticker: ticker!, exchange: exchange ?? '' });
      const res = await fetch(`/api/stock/fundamentals?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch fundamentals');
      return data;
    },
    enabled: !!ticker,
    staleTime: SIX_HOURS_MS,
  });
}
