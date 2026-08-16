import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface RefreshPricesResult {
  updated: string[];
  failed: string[];
  failedReasons?: Record<string, string>;
  message?: string;
}

/**
 * Refreshes live prices via `/api/prices/refresh` — mutual fund NAVs from AMFI
 * and Stock/ETF quotes from Yahoo Finance.
 *
 * Previously invoked the `refresh-prices` Edge Function, which covered Stock/ETF
 * only. The route supersedes it so mutual funds are priced too and the matching
 * rules can live in unit-tested shared logic.
 */
export function useRefreshPrices() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (): Promise<RefreshPricesResult> => {
      const res = await fetch('/api/prices/refresh', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to refresh prices');
      return data as RefreshPricesResult;
    },
    onSuccess: () => {
      // Every value derived from a price has to re-read: the portfolio table,
      // allocation chart, and net worth all consume holdings.live_price.
      queryClient.invalidateQueries({ queryKey: ['holdings', userId] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
      queryClient.invalidateQueries({ queryKey: ['netWorth', userId] });
    },
  });

  return {
    refresh: mutation.mutateAsync,
    isRefreshing: mutation.isPending,
    result: mutation.data,
    error: mutation.error,
  };
}
