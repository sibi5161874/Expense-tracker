import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function getRecurringTransactions(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select(`
      *,
      from_account:accounts!recurring_transactions_from_account_id_fkey(id, name, type),
      to_account:accounts!recurring_transactions_to_account_id_fkey(id, name, type),
      category:categories(id, name, type)
    `)
    .eq('user_id', userId)
    .order('next_run_date', { ascending: true });

  if (error) throw error;
  return data;
}

/** Active rules due to run (next_run_date <= today) — used to generate transactions on app load. */
export async function getDueRecurringTransactions(
  supabase: SupabaseClient<Database>,
  userId: string,
  asOfDate: string
) {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .lte('next_run_date', asOfDate);

  if (error) throw error;
  return data;
}
