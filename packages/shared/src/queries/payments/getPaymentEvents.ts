import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

/**
 * A user's own payment history — RLS (`payment_events_select_own`) already restricts this to
 * the caller's own rows, so this needs no admin role or service_role client. Ordered newest
 * first, matching every other history-style list in the app.
 */
export async function getPaymentEvents(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('payment_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
