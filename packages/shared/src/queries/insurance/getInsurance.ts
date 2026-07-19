import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function getInsurancePolicies(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('insurance_policies')
    .select('*')
    .eq('user_id', userId)
    .order('premium_due_date', { ascending: true });

  if (error) throw error;
  return data;
}
