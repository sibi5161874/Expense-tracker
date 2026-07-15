import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { AssetFixedDepositInput } from '../../schemas';
import type { AssetGoldInput } from '../../schemas';
import type { AssetLoanLiabilityInput } from '../../schemas';

export async function createFixedDeposit(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: AssetFixedDepositInput
) {
  const { data: result, error } = await supabase
    .from('assets_fixed_deposits')
    .insert({
      ...data,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function createGold(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: AssetGoldInput
) {
  const { data: result, error } = await supabase
    .from('assets_gold')
    .insert({
      ...data,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function createLoanLiability(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: AssetLoanLiabilityInput
) {
  const { data: result, error } = await supabase
    .from('assets_loans_liabilities')
    .insert({
      ...data,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}
