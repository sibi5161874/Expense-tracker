import { useQuery } from '@tanstack/react-query';
import type { YahooHistoryPoint } from '@repo/shared/logic';

export type BenchmarkRange = '1mo' | '3mo' | '6mo' | '1y';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/** Daily closing-price history for a benchmark ticker via /api/live-price/history. */
export function useBenchmarkHistory(ticker: string, range: BenchmarkRange, enabled = true) {
  return useQuery({
    queryKey: ['benchmark-history', ticker, range],
    queryFn: async (): Promise<YahooHistoryPoint[]> => {
      const res = await fetch(`/api/live-price/history?ticker=${encodeURIComponent(ticker)}&range=${range}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch history');
      return data.points as YahooHistoryPoint[];
    },
    enabled,
    staleTime: SIX_HOURS_MS,
  });
}
