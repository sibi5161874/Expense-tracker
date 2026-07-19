import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getAllTransactionsForReports } from '@repo/shared/queries/transactions';

/** Mirrors apps/web/src/hooks/useReportsData.ts's useAllTimeTransactions — for net worth account balances. */
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
