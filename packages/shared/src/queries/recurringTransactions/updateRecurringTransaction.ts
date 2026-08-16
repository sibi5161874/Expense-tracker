import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { RecurringTransactionInput } from '../../schemas';

export async function updateRecurringTransaction(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<RecurringTransactionInput>
) {
  const { data: result, error } = await supabase
    .from('recurring_transactions')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
