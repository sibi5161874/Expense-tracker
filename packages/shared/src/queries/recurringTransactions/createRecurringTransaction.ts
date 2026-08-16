import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { RecurringTransactionInput } from '../../schemas';

export async function createRecurringTransaction(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: RecurringTransactionInput
) {
  const { data: result, error } = await supabase
    .from('recurring_transactions')
    .insert({ ...data, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return result;
}
