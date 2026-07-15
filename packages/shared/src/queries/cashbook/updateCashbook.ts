import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { CashbookInput } from '../../schemas';

export async function updateCashbook(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<CashbookInput>
) {
  const { data: result, error } = await supabase
    .from('cashbook')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
