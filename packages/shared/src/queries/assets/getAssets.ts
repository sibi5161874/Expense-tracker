import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function getFixedDeposits(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_fixed_deposits')
    .select('*')
    .eq('user_id', userId)
    .order('maturity_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getGold(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_gold')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function getLoansLiabilities(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_loans_liabilities')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}
