import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { InsurancePolicyInput } from '../../schemas';

export async function updateInsurancePolicy(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<InsurancePolicyInput>
) {
  const { data: result, error } = await supabase
    .from('insurance_policies')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
