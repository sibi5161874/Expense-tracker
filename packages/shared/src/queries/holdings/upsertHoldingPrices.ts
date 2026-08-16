import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export interface HoldingPriceUpdate {
  symbol: string;
  live_price: number;
  display_name?: string | null;
}

/**
 * Writes refreshed prices into `holdings`, creating the row if this is the first
 * time a symbol has been priced. Relies on the table's `unique (user_id, symbol)`
 * constraint so a refresh is idempotent — running it twice updates in place
 * rather than duplicating rows.
 */
export async function upsertHoldingPrices(
  supabase: SupabaseClient<Database>,
  userId: string,
  updates: HoldingPriceUpdate[]
) {
  if (updates.length === 0) return [];

  const { data, error } = await supabase
    .from('holdings')
    .upsert(
      updates.map((u) => ({ user_id: userId, symbol: u.symbol, live_price: u.live_price })),
      { onConflict: 'user_id,symbol' }
    )
    .select();

  if (error) throw error;
  return data;
}
