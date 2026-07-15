import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function deleteAccount(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
) {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) throw error;
}
