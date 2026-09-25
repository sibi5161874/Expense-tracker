import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function getFixedDeposits(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_fixed_deposits')
    .select('*')
    .eq('user_id', userId)
    .order('maturity_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getGold(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_gold')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function getLoansLiabilities(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_loans_liabilities')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function getEpfAccounts(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from('assets_epf').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function getNpsAccounts(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from('assets_nps').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function getSsyAccounts(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_ssy')
    .select('*')
    .eq('user_id', userId)
    .order('opening_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getSgbHoldings(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_sgb')
    .select('*')
    .eq('user_id', userId)
    .order('issue_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getUlipPolicies(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_ulip')
    .select('*')
    .eq('user_id', userId)
    .order('maturity_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getRealEstate(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_real_estate')
    .select('*')
    .eq('user_id', userId)
    .order('purchase_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getPpfAccounts(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_ppf')
    .select('*')
    .eq('user_id', userId)
    .order('opening_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getRecurringDeposits(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_recurring_deposits')
    .select('*')
    .eq('user_id', userId)
    .order('maturity_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getNscCertificates(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_nsc')
    .select('*')
    .eq('user_id', userId)
    .order('maturity_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getVehicles(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('purchase_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getCryptoAssets(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('assets_crypto')
    .select('*')
    .eq('user_id', userId)
    .order('purchase_date', { ascending: true });
  if (error) throw error;
  return data;
}

