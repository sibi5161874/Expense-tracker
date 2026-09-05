import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWebApi } from '@/lib/webApi';
import type { StockFundamentals } from '@repo/shared/logic';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/** Mirrors apps/web/src/hooks/useStockFundamentals.ts. Same queryKey shape as
 * usePassiveIncome so a symbol's fetch is shared between the dashboard widget and this
 * detail screen. */
export function useStockFundamentals(ticker: string | null) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['stock-fundamentals', ticker],
    queryFn: () => {
      if (!session) throw new Error('Not authenticated');
      return fetchWebApi<StockFundamentals & { ticker: string }>(
        `/api/stock/fundamentals?ticker=${encodeURIComponent(ticker!)}`,
        session.access_token
      );
    },
    enabled: !!ticker && !!session,
    staleTime: SIX_HOURS_MS,
  });
}
