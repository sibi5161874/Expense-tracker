import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { InvestmentLogInput } from '../../schemas';

export async function updateInvestmentLog(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<InvestmentLogInput>
) {
  const { data: result, error } = await supabase
    .from('investment_log')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
