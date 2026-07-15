import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function deleteCategory(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) throw error;
}
