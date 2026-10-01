import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { ContactInput } from '../../schemas';

export async function createContact(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: ContactInput
) {
  const { data: result, error } = await supabase
    .from('contacts')
    .insert({
      name: data.name,
      avatar_seed: data.name,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}
