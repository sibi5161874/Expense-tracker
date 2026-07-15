import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { GoalInput } from '../../schemas';

export async function updateGoal(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<GoalInput>
) {
  const { data: result, error } = await supabase
    .from('goals')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
