import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function getGoals(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('target_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getGoalById(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
