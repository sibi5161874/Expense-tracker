import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { TransactionInput } from '../../schemas';

export async function createTransactionsBulk(
  supabase: SupabaseClient<Database>,
  userId: string,
  rows: TransactionInput[]
) {
  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from('transactions')
    .insert(rows.map((data) => ({ ...data, user_id: userId })))
    .select();

  if (error) throw error;
  return data;
}
