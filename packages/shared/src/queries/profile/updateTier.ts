import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

/**
 * Separate from upsertUserProfile/userProfileSchema deliberately: that schema
 * is the onboarding wizard's user-editable fields (DOB, income, dependents).
 * Tier is billing state, set only by startTrial()/purchaseLifetime() in
 * logic/entitlements.ts — never something a form lets the user type into.
 */
export interface TierUpdateFields {
  tier: Database['public']['Tables']['user_profiles']['Row']['tier'];
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  lifetime_purchased_at?: string | null;
}

export async function updateUserTier(supabase: SupabaseClient<Database>, userId: string, data: TierUpdateFields) {
  const { data: result, error } = await supabase
    .from('user_profiles')
    .upsert({ ...data, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return result;
}
