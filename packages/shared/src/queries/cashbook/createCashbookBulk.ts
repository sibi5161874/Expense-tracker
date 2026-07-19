import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { CashbookInput } from '../../schemas';

export async function createCashbookBulk(
  supabase: SupabaseClient<Database>,
  userId: string,
  rows: CashbookInput[]
) {
  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from('cashbook')
    .insert(rows.map((data) => ({ ...data, user_id: userId })))
    .select();

  if (error) throw error;
  return data;
}
