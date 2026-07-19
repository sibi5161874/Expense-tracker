import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function deleteFixedDeposit(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
) {
  const { error } = await supabase
    .from('assets_fixed_deposits')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteGold(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
) {
  const { error } = await supabase
    .from('assets_gold')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteLoanLiability(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
) {
  const { error } = await supabase
    .from('assets_loans_liabilities')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteEpfAccount(supabase: SupabaseClient<Database>, userId: string, id: string) {
  const { error } = await supabase.from('assets_epf').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}

export async function deleteNpsAccount(supabase: SupabaseClient<Database>, userId: string, id: string) {
  const { error } = await supabase.from('assets_nps').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}

export async function deleteSsyAccount(supabase: SupabaseClient<Database>, userId: string, id: string) {
  const { error } = await supabase.from('assets_ssy').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}

export async function deleteSgbHolding(supabase: SupabaseClient<Database>, userId: string, id: string) {
  const { error } = await supabase.from('assets_sgb').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}

export async function deleteUlipPolicy(supabase: SupabaseClient<Database>, userId: string, id: string) {
  const { error } = await supabase.from('assets_ulip').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}
