import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

/** Lightweight unpaginated fetch used only to detect duplicate rows during CSV import (date+symbol+quantity+price). */
export async function getInvestmentLogForDedup(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('investment_log')
    .select('date, symbol, quantity, price')
    .eq('user_id', userId)
    .limit(20000);

  if (error) throw error;
  return data;
}
