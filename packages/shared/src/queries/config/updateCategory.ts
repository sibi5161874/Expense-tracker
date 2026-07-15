import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { CategoryInput } from '../../schemas';

export async function updateCategory(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<CategoryInput>
) {
  const { data: result, error } = await supabase
    .from('categories')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
