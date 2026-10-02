import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export interface HoldingPriceUpdate {
  symbol: string;
  live_price: number;
  /** ISO currency the price is quoted in ("INR", "USD", ...), when the source reports one. */
  live_currency?: string | null;
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
      updates.map((u) => ({
        user_id: userId,
        symbol: u.symbol,
        live_price: u.live_price,
        // Only written when the source reported a currency, so an unknown one never overwrites a
        // previously recorded value with null.
        ...(u.live_currency ? { live_currency: u.live_currency } : {}),
        // Same rule for the name: only written when known (funds, from AMFI), never blanked.
        ...(u.display_name ? { display_name: u.display_name } : {}),
      })),
      { onConflict: 'user_id,symbol' }
    )
    .select();

  if (error) throw error;
  return data;
}
