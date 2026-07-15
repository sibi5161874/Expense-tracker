import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { InvestmentLogInput } from '../../schemas';

export async function createInvestmentLog(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: InvestmentLogInput
) {
  const { data: result, error } = await supabase
    .from('investment_log')
    .insert({
      ...data,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}
