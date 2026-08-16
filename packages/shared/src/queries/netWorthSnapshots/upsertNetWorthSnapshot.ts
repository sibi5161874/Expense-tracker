import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { NetWorthSnapshotInput } from '../../schemas';

/** Insert-or-replace by (user_id, snapshot_date) — re-taking a snapshot the same day overwrites it rather than erroring. */
export async function upsertNetWorthSnapshot(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: NetWorthSnapshotInput
) {
  const { data: result, error } = await supabase
    .from('net_worth_snapshots')
    .upsert({ ...data, user_id: userId }, { onConflict: 'user_id,snapshot_date' })
    .select()
    .single();

  if (error) throw error;
  return result;
}
