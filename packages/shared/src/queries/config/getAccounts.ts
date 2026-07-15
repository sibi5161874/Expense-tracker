import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function getAccounts(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getActiveAccounts(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getAccountById(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
