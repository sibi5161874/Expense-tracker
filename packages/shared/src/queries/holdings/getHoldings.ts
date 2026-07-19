import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

/** Manual live_price overrides per symbol (DATA_MODEL.md §3) — written only by the refresh-prices Edge Function. */
export async function getHoldings(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from('holdings').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
}
