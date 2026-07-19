import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { InvestmentLogInput } from '../../schemas';

export async function createInvestmentLogsBulk(
  supabase: SupabaseClient<Database>,
  userId: string,
  rows: InvestmentLogInput[]
) {
  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from('investment_log')
    .insert(rows.map((data) => ({ ...data, user_id: userId })))
    .select();

  if (error) throw error;
  return data;
}
