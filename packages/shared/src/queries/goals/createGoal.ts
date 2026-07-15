import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { GoalInput } from '../../schemas';

export async function createGoal(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: GoalInput
) {
  const { data: result, error } = await supabase
    .from('goals')
    .insert({
      ...data,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}
