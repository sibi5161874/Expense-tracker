import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { UserProfileInput } from '../../schemas';

/** One row per user — insert on first save, update on every save after (onConflict: user_id). */
export async function upsertUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: Partial<UserProfileInput>
) {
  const { data: result, error } = await supabase
    .from('user_profiles')
    .upsert({ ...data, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return result;
}
