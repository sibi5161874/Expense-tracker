import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { AssetFixedDepositInput } from '../../schemas';
import type { AssetGoldInput } from '../../schemas';
import type { AssetLoanLiabilityInput } from '../../schemas';

export async function updateFixedDeposit(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AssetFixedDepositInput>
) {
  const { data: result, error } = await supabase
    .from('assets_fixed_deposits')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateGold(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AssetGoldInput>
) {
  const { data: result, error } = await supabase
    .from('assets_gold')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateLoanLiability(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AssetLoanLiabilityInput>
) {
  const { data: result, error } = await supabase
    .from('assets_loans_liabilities')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
