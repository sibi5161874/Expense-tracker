import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { CategoryInput } from '../../schemas';

export async function createCategory(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: CategoryInput
) {
  const { data: result, error } = await supabase
    .from('categories')
    .insert({
      ...data,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}
