import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { BudgetLimitInput } from '../../schemas';

export async function createBudgetLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: BudgetLimitInput
) {
  const { data: result, error } = await supabase
    .from('budget_limits')
    .insert({ ...data, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return result;
}
