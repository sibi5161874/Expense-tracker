import { useQueries } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWebApi } from '@/lib/webApi';
import { calculatePassiveIncome, type SymbolHolding, type StockFundamentals } from '@repo/shared/logic';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/** Mirrors apps/web/src/hooks/usePassiveIncome.ts — same queryKey shape
 * (['stock-fundamentals', symbol]) as useStockFundamentals, so a holding's detail screen and
 * this dashboard widget share one cached fetch per symbol. */
export function usePassiveIncome(holdings: SymbolHolding[]) {
  const { session } = useAuth();
  const uniqueSymbols = [...new Set(holdings.map((h) => h.symbol))];

  const results = useQueries({
    queries: uniqueSymbols.map((symbol) => ({
      queryKey: ['stock-fundamentals', symbol],
      queryFn: () => {
        if (!session) throw new Error('Not authenticated');
        return fetchWebApi<StockFundamentals & { ticker: string }>(
          `/api/stock/fundamentals?ticker=${encodeURIComponent(symbol)}`,
          session.access_token
        );
      },
      enabled: !!session,
      staleTime: SIX_HOURS_MS,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const yieldBySymbol = new Map(uniqueSymbols.map((symbol, i) => [symbol, results[i]?.data?.trailingAnnualDividendYield ?? null]));

  const summary = calculatePassiveIncome(
    holdings.map((h) => ({
      unitsHeld: h.unitsHeld,
      currentPrice: h.currentPrice,
      dividendYield: yieldBySymbol.get(h.symbol) ?? null,
    }))
  );

  return { ...summary, isLoading };
}
