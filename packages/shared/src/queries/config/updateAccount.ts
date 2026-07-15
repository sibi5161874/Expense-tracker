import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { AccountInput } from '../../schemas';

export async function updateAccount(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AccountInput>
) {
  const { data: result, error } = await supabase
    .from('accounts')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
