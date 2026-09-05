import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getPaymentEvents } from '@repo/shared/queries/payments';

/** Backs the Billing tab's "Payment history" section — the closest thing to a reconciliation
 * view this app has without inventing an admin-role system that doesn't exist anywhere else
 * in the codebase. RLS already scopes this to the caller's own rows. */
export function usePaymentEvents() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['paymentEvents', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getPaymentEvents(supabase, userId);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}
