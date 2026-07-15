import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { TransactionInput } from '../../schemas';

export async function updateTransaction(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<TransactionInput>
) {
  const { data: result, error } = await supabase
    .from('transactions')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
