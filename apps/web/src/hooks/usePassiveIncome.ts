import { useQueries } from '@tanstack/react-query';
import { calculatePassiveIncome, type SymbolHolding, type StockFundamentals } from '@repo/shared/logic';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/**
 * Annual/monthly passive-income projection across every held symbol. Batches one fundamentals
 * fetch per unique symbol via useQueries (holdings can repeat a symbol across accounts, so
 * this dedupes before fetching) — and deliberately reuses the same queryKey shape
 * (['stock-fundamentals', symbol]) as useStockFundamentals, so visiting a stock's own detail
 * page and this widget share one cached fetch per symbol instead of two.
 */
export function usePassiveIncome(holdings: SymbolHolding[]) {
  const uniqueSymbols = [...new Set(holdings.map((h) => h.symbol))];

  const results = useQueries({
    queries: uniqueSymbols.map((symbol) => ({
      queryKey: ['stock-fundamentals', symbol],
      queryFn: async (): Promise<StockFundamentals & { ticker: string }> => {
        const res = await fetch(`/api/stock/fundamentals?ticker=${encodeURIComponent(symbol)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to fetch fundamentals');
        return data;
      },
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
