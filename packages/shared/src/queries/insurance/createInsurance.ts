import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { InsurancePolicyInput } from '../../schemas';

export async function createInsurancePolicy(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: InsurancePolicyInput
) {
  const { data: result, error } = await supabase
    .from('insurance_policies')
    .insert({ ...data, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return result;
}
