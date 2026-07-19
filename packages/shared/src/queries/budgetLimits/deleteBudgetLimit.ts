import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function deleteBudgetLimit(supabase: SupabaseClient<Database>, userId: string, id: string) {
  const { error } = await supabase.from('budget_limits').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}
