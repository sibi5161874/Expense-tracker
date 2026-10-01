import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getNetWorthRawData } from '@repo/shared/queries/netWorth';
import { STALE_TIME_SHORT } from '@/lib/queryStaleTimes';

/**
 * NetWorthReport.tsx's client-side counterpart to computeUserNetWorth — one
 * get_net_worth_raw_data RPC call instead of 13 separate per-asset-type hooks (useFixedDeposits,
 * useGoldAssets, ... each its own round trip). See
 * supabase/migrations/20261001000002_net_worth_raw_data_rpc.sql.
 */
export function useNetWorthRawData() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['netWorthRawData', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getNetWorthRawData(supabase, userId);
    },
    enabled: !!userId,
    staleTime: STALE_TIME_SHORT,
  });
}
