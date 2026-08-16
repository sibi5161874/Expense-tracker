import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { NetWorthSnapshotInput } from '../../schemas';

export async function updateNetWorthSnapshot(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<NetWorthSnapshotInput>
) {
  const { data: result, error } = await supabase
    .from('net_worth_snapshots')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
