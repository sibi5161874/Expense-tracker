import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

/** Lightweight unpaginated fetch used only to detect duplicate rows during CSV import (date+counterparty+amount+flow). */
export async function getCashbookForDedup(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('cashbook')
    .select('date, counterparty, amount, flow')
    .eq('user_id', userId)
    .limit(20000);

  if (error) throw error;
  return data;
}
