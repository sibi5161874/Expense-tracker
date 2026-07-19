import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

/** Returns null (not an error) when the user hasn't created a profile yet. */
export async function getUserProfile(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
