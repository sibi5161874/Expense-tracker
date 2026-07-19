import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

/** Lightweight unpaginated fetch used only to detect duplicate rows during CSV import (date+category_id+amount). */
export async function getTransactionsForDedup(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('date, category_id, amount')
    .eq('user_id', userId)
    .limit(20000);

  if (error) throw error;
  return data;
}
