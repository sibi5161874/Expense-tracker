import { useMemo } from 'react';
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

/** Mirrors apps/web/src/hooks/useMonthlyTrend.ts. */
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

  // eslint-disable-next-line react-hooks/exhaustive-deps -- resultsData length is fixed by `n`
  const data = useMemo(() => {
    return months.map((month, i) => {
      const txns = resultsData[i] ?? [];
      const income = txns.reduce((sum, t) => (t.type === 'Income' ? sum + t.amount : sum), 0);
      const expense = txns.reduce((sum, t) => (t.type === 'Expense' ? sum + t.amount : sum), 0);
      const label = new Date(`${month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short' });
      return { month, label, income, expense };
    });
  }, [months.join(','), ...resultsData]);

  return { data, isLoading };
}
