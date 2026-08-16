import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function getNetWorthSnapshots(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('net_worth_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: true });

  if (error) throw error;
  return data;
}
