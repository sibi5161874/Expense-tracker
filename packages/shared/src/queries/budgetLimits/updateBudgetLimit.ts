import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { BudgetLimitInput } from '../../schemas';

export async function updateBudgetLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<BudgetLimitInput>
) {
  const { data: result, error } = await supabase
    .from('budget_limits')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
