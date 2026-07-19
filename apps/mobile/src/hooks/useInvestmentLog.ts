import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getAllInvestmentLog } from '@repo/shared/queries/investmentLog';

/** Mirrors apps/web/src/hooks/useInvestmentLog.ts's useAllInvestmentLog — unpaginated, for aggregation only. */
export function useAllInvestmentLog() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['allInvestmentLog', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getAllInvestmentLog(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}
