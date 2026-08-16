import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { AssetFixedDepositInput } from '../../schemas';
import type { AssetGoldInput } from '../../schemas';
import type { AssetLoanLiabilityInput } from '../../schemas';
import type { AssetEpfInput } from '../../schemas';
import type { AssetNpsInput } from '../../schemas';
import type { AssetSsyInput } from '../../schemas';
import type { AssetSgbInput } from '../../schemas';
import type { AssetUlipInput } from '../../schemas';
import type { AssetRealEstateInput } from '../../schemas';
import type { AssetPpfInput } from '../../schemas';
import type { AssetRecurringDepositInput } from '../../schemas';
import type { AssetNscInput } from '../../schemas';
import type { AssetVehicleInput } from '../../schemas';

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

export async function updateEpfAccount(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AssetEpfInput>
) {
  const { data: result, error } = await supabase
    .from('assets_epf')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateNpsAccount(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AssetNpsInput>
) {
  const { data: result, error } = await supabase
    .from('assets_nps')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateSsyAccount(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AssetSsyInput>
) {
  const { data: result, error } = await supabase
    .from('assets_ssy')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateSgbHolding(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AssetSgbInput>
) {
  const { data: result, error } = await supabase
    .from('assets_sgb')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateUlipPolicy(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AssetUlipInput>
) {
  const { data: result, error } = await supabase
    .from('assets_ulip')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateRealEstate(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AssetRealEstateInput>
) {
  const { data: result, error } = await supabase
    .from('assets_real_estate')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updatePpfAccount(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AssetPpfInput>
) {
  const { data: result, error } = await supabase
    .from('assets_ppf')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateRecurringDeposit(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AssetRecurringDepositInput>
) {
  const { data: result, error } = await supabase
    .from('assets_recurring_deposits')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateNscCertificate(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AssetNscInput>
) {
  const { data: result, error } = await supabase
    .from('assets_nsc')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateVehicle(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<AssetVehicleInput>
) {
  const { data: result, error } = await supabase
    .from('assets_vehicles')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}
