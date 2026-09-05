import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWebApi } from '@/lib/webApi';
import type { YahooHistoryPoint } from '@repo/shared/logic';

export type BenchmarkRange = '1mo' | '3mo' | '6mo' | '1y';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/** Mirrors apps/web/src/hooks/useBenchmarkHistory.ts — daily closing-price history for a
 * benchmark ticker via /api/live-price/history. */
export function useBenchmarkHistory(ticker: string, range: BenchmarkRange, enabled = true) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['benchmark-history', ticker, range],
    queryFn: async () => {
      if (!session) throw new Error('Not authenticated');
      const data = await fetchWebApi<{ points: YahooHistoryPoint[] }>(
        `/api/live-price/history?ticker=${encodeURIComponent(ticker)}&range=${range}`,
        session.access_token
      );
      return data.points;
    },
    enabled: enabled && !!session,
    staleTime: SIX_HOURS_MS,
  });
}
