import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

/** Single batched delete for the cashbook page's bulk-select action — one round trip
 * regardless of selection size, matching deleteTransactionsBulk's reasoning. */
export async function deleteCashbookBulk(
  supabase: SupabaseClient<Database>,
  userId: string,
  ids: string[]
) {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from('cashbook')
    .delete()
    .eq('user_id', userId)
    .in('id', ids);

  if (error) throw error;
}
