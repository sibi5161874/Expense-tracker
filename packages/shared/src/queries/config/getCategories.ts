import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export async function getCategories(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getCategoriesByType(
  supabase: SupabaseClient<Database>,
  userId: string,
  type: 'Income' | 'Expense' | 'Transfer'
) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getCategoryById(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
