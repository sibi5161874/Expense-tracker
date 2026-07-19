import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import { monthDateRange } from '../../utils/date';

const PAGE_SIZE = 50;

export interface GetTransactionsOptions {
  month?: string;
  page?: number;
  type?: 'Income' | 'Expense' | 'Transfer';
  category_id?: string;
}

export async function getTransactions(
  supabase: SupabaseClient<Database>,
  userId: string,
  opts: GetTransactionsOptions = {}
) {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      from_account:accounts!transactions_from_account_id_fkey(id, name, type),
      to_account:accounts!transactions_to_account_id_fkey(id, name, type),
      category:categories(id, name, type)
    `)
    .eq('user_id', userId);

  if (opts.month) {
    const { from: monthStart, to: monthEnd } = monthDateRange(opts.month);
    query = query.gte('date', monthStart).lt('date', monthEnd);
  }

  if (opts.type) {
    query = query.eq('type', opts.type);
  }

  if (opts.category_id) {
    query = query.eq('category_id', opts.category_id);
  }

  const page = opts.page ?? 0;
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  query = query.order('date', { ascending: false }).range(from, to);

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getTransactionById(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      from_account:accounts!transactions_from_account_id_fkey(id, name, type),
      to_account:accounts!transactions_to_account_id_fkey(id, name, type),
      category:categories(id, name, type)
    `)
    .eq('user_id', userId)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/** Unpaginated fetch for aggregate calculations (dashboard/monthly totals) — never for list rendering. */
export async function getAllTransactionsForMonth(
  supabase: SupabaseClient<Database>,
  userId: string,
  month: string
) {
  const { from: monthStart, to: monthEnd } = monthDateRange(month);
  const { data, error } = await supabase
    .from('transactions')
    .select('id, date, type, amount, category_id, category:categories(name)')
    .eq('user_id', userId)
    .gte('date', monthStart)
    .lt('date', monthEnd);

  if (error) throw error;
  return data;
}

/**
 * Unpaginated fetch for report/aggregate calculations (net worth, year in review,
 * spending trend, account-wise flow) — never for list rendering. Omit `from`/`to`
 * to fetch all-time (capped at 20,000 rows as a safety limit).
 */
export async function getAllTransactionsForReports(
  supabase: SupabaseClient<Database>,
  userId: string,
  opts: { from?: string; to?: string } = {}
) {
  let query = supabase
    .from('transactions')
    .select(
      'id, date, type, amount, category_id, from_account_id, to_account_id, category:categories(name), from_account:accounts!transactions_from_account_id_fkey(name), to_account:accounts!transactions_to_account_id_fkey(name)'
    )
    .eq('user_id', userId);

  if (opts.from) query = query.gte('date', opts.from);
  if (opts.to) query = query.lt('date', opts.to);

  const { data, error } = await query.order('date', { ascending: true }).limit(20000);

  if (error) throw error;
  return data;
}
