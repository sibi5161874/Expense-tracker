import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { CashbookInput } from '../../schemas';

export async function createCashbook(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: CashbookInput
) {
  const { data: result, error } = await supabase
    .from('cashbook')
    .insert({
      ...data,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}
