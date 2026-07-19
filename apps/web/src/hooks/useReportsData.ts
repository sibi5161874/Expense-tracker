import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getAllTransactionsForReports } from '@repo/shared/queries/transactions';
import { formatMonth } from '@repo/shared/utils';

/** Transactions in a [from, to) date range — for reports that need more than one month. */
export function useTransactionsInRange(from: string, to: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['reportTransactions', userId, from, to],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getAllTransactionsForReports(supabase, userId, { from, to });
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

/** All-time transactions — for net worth account balances. Capped at 20,000 rows. */
export function useAllTimeTransactions() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['reportTransactions', userId, 'all-time'],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getAllTransactionsForReports(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function monthsAgo(n: number): string {
  const now = new Date();
  return formatMonth(new Date(now.getFullYear(), now.getMonth() - n, 1)) + '-01';
}

export function yearRange(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year + 1}-01-01` };
}
