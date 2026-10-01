import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function getContacts(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}
