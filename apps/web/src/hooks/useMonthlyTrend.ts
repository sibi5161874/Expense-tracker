import { useQueries } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getAllTransactionsForMonth } from '@repo/shared/queries/transactions';
import { formatMonth } from '@repo/shared/utils';

function lastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(formatMonth(d));
  }
  return months;
}

/**
 * Income/expense totals for the last `n` months — client-side interim for the
 * dashboard trend chart. RULES.md §15 flags this as belonging in a SQL view;
 * this fetches month-by-month rather than pulling the full unbounded table.
 */
export function useMonthlyTrend(n = 6) {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const months = lastNMonths(n);

  const results = useQueries({
    queries: months.map((month) => ({
      queryKey: ['monthlyOverview', userId, month],
      queryFn: () => {
        if (!userId) throw new Error('User not authenticated');
        return getAllTransactionsForMonth(supabase, userId, month);
      },
      enabled: !!userId,
      staleTime: 60_000,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const resultsData = results.map((r) => r.data);

  // Not memoized: useMemo needs a static, analyzable dependency array, and this one's length
  // varies with `n` (via `...resultsData`), which isn't expressible as an array literal.
  // Recomputing is cheap regardless — at most `n` months of already-fetched data, a couple of
  // reduce() passes each — so there's nothing worth caching here.
  const data = months.map((month, i) => {
    const txns = resultsData[i] ?? [];
    const income = txns.reduce((sum, t) => (t.type === 'Income' ? sum + t.amount : sum), 0);
    const expense = txns.reduce((sum, t) => (t.type === 'Expense' ? sum + t.amount : sum), 0);
    const label = new Date(`${month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short' });
    return { month, label, income, expense };
  });

  return { data, isLoading };
}
