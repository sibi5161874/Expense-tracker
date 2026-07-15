import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { TransactionInput } from '../../schemas';

export async function createTransaction(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: TransactionInput
) {
  const { data: result, error } = await supabase
    .from('transactions')
    .insert({
      ...data,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}
