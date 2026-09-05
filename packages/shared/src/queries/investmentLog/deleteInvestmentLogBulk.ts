import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

/** Single batched delete for the investment log page's bulk-select action — one round trip
 * regardless of selection size, matching deleteTransactionsBulk's reasoning. */
export async function deleteInvestmentLogBulk(
  supabase: SupabaseClient<Database>,
  userId: string,
  ids: string[]
) {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from('investment_log')
    .delete()
    .eq('user_id', userId)
    .in('id', ids);

  if (error) throw error;
}
