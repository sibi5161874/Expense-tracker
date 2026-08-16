import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function deleteNetWorthSnapshot(supabase: SupabaseClient<Database>, userId: string, id: string) {
  const { error } = await supabase.from('net_worth_snapshots').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}
