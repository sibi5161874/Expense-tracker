import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

/** Single batched delete for the transactions page's bulk-select action — one round trip
 * regardless of selection size, instead of N individual `deleteTransaction` calls where a
 * mid-loop failure leaves an unclear partial state. */
export async function deleteTransactionsBulk(
  supabase: SupabaseClient<Database>,
  userId: string,
  ids: string[]
) {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', userId)
    .in('id', ids);

  if (error) throw error;
}
