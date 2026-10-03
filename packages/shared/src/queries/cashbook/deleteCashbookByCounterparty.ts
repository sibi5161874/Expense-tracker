import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function deleteCashbookByCounterparty(
  supabase: SupabaseClient<Database>,
  userId: string,
  counterparty: string
) {
  const { error } = await supabase
    .from('cashbook')
    .delete()
    .eq('user_id', userId)
    .eq('counterparty', counterparty);

  if (error) throw error;
}
