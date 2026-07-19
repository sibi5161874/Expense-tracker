import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function getBudgetLimits(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('budget_limits')
    .select('*, category:categories(id, name, type)')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}
