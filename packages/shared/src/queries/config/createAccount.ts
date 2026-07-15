import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { AccountInput } from '../../schemas';

export async function createAccount(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: AccountInput
) {
  const { data: result, error } = await supabase
    .from('accounts')
    .insert({
      ...data,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}
