import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getMonthlyTrend } from '@repo/shared/queries/transactions';

/**
 * Income/expense totals for the last `n` months — one get_monthly_trend Postgres call
 * (RULES.md §14) instead of `n` separate full-month fetches reduced client-side.
 */
export function useMonthlyTrend(n = 6) {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  const query = useQuery({
    queryKey: ['monthlyTrend', userId, n],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getMonthlyTrend(supabase, userId, n);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const data = (query.data ?? []).map((row) => ({
    month: row.month,
    label: new Date(`${row.month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short' }),
    income: row.income,
    expense: row.expense,
  }));

  return { data, isLoading: query.isLoading };
}
