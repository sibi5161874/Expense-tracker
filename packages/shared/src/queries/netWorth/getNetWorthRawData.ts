import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

/**
 * One Postgres round trip bundling every raw dataset computeUserNetWorth needs (accounts,
 * transactions, investment_log, holdings, and 13 asset tables) instead of 17 separate
 * `select *` calls — see supabase/migrations/20261001000002_net_worth_raw_data_rpc.sql.
 * The calculation logic consuming this (calculateAccountBalances, calculateNetWorth, etc.
 * in packages/shared/src/logic) is unchanged — only where the rows come from changes.
 */
export async function getNetWorthRawData(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc('get_net_worth_raw_data', { p_user_id: userId });
  if (error) throw error;
  return data;
}
