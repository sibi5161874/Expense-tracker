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

export async function createEpfAccount(supabase: SupabaseClient<Database>, userId: string, data: AssetEpfInput) {
  const { data: result, error } = await supabase
    .from('assets_epf')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function createNpsAccount(supabase: SupabaseClient<Database>, userId: string, data: AssetNpsInput) {
  const { data: result, error } = await supabase
    .from('assets_nps')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function createSsyAccount(supabase: SupabaseClient<Database>, userId: string, data: AssetSsyInput) {
  const { data: result, error } = await supabase
    .from('assets_ssy')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function createSgbHolding(supabase: SupabaseClient<Database>, userId: string, data: AssetSgbInput) {
  const { data: result, error } = await supabase
    .from('assets_sgb')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function createUlipPolicy(supabase: SupabaseClient<Database>, userId: string, data: AssetUlipInput) {
  const { data: result, error } = await supabase
    .from('assets_ulip')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function createRealEstate(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: AssetRealEstateInput
) {
  const { data: result, error } = await supabase
    .from('assets_real_estate')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function createPpfAccount(supabase: SupabaseClient<Database>, userId: string, data: AssetPpfInput) {
  const { data: result, error } = await supabase
    .from('assets_ppf')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function createRecurringDeposit(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: AssetRecurringDepositInput
) {
  const { data: result, error } = await supabase
    .from('assets_recurring_deposits')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function createNscCertificate(supabase: SupabaseClient<Database>, userId: string, data: AssetNscInput) {
  const { data: result, error } = await supabase
    .from('assets_nsc')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function createVehicle(supabase: SupabaseClient<Database>, userId: string, data: AssetVehicleInput) {
  const { data: result, error } = await supabase
    .from('assets_vehicles')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return result;
}
