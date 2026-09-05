import { useQuery } from '@tanstack/react-query';
import type { StockFundamentals } from '@repo/shared/logic';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/** Fundamentals (P/E, 52-week range, margins, market cap, beta, dividend yield) for one ticker via /api/stock/fundamentals — Pro-gated and cached server-side, so this is cheap to mount from a detail page or a per-holding loop alike. */
export function useStockFundamentals(ticker: string | null) {
  return useQuery({
    queryKey: ['stock-fundamentals', ticker],
    queryFn: async (): Promise<StockFundamentals & { ticker: string }> => {
      const res = await fetch(`/api/stock/fundamentals?ticker=${encodeURIComponent(ticker!)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch fundamentals');
      return data;
    },
    enabled: !!ticker,
    staleTime: SIX_HOURS_MS,
  });
}
