import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export const CASHBOOK_PAGE_SIZE = 10;
const PAGE_SIZE = CASHBOOK_PAGE_SIZE;

export interface GetCashbookOptions {
  counterparty?: string;
  page?: number;
  pageSize?: number;
  flow?: 'Gave' | 'Received';
}

export async function getCashbook(
  supabase: SupabaseClient<Database>,
  userId: string,
  opts: GetCashbookOptions = {}
) {
  let query = supabase
    .from('cashbook')
    .select(`
      *,
      account_used:accounts!cashbook_account_used_id_fkey(id, name, type)
    `)
    .eq('user_id', userId);

  if (opts.counterparty) {
    query = query.eq('counterparty', opts.counterparty);
  }

  if (opts.flow) {
    query = query.eq('flow', opts.flow);
  }

  const page = opts.page ?? 0;
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  query = query.order('date', { ascending: false }).range(from, to);

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/** Row count for the same filters `getCashbook` applies — a separate `head: true` request
 * so paginated views can render "Page X of Y" without widening the main query's payload. */
export async function getCashbookCount(
  supabase: SupabaseClient<Database>,
  userId: string,
  opts: Pick<GetCashbookOptions, 'counterparty' | 'flow'> = {}
) {
  let query = supabase
    .from('cashbook')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (opts.counterparty) query = query.eq('counterparty', opts.counterparty);
  if (opts.flow) query = query.eq('flow', opts.flow);

  const { count, error } = await query;

  if (error) throw error;
  return count ?? 0;
}

export async function getCashbookById(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
) {
  const { data, error } = await supabase
    .from('cashbook')
    .select(`
      *,
      account_used:accounts!cashbook_account_used_id_fkey(id, name, type)
    `)
    .eq('user_id', userId)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getCashbookSummary(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('cashbook')
    .select('counterparty, flow, amount, due_date')
    .eq('user_id', userId);

  if (error) throw error;

  // Group by counterparty and calculate net balance
  const summary: Record<
    string,
    { totalGiven: number; totalReceived: number; netBalance: number; hasOverdue: boolean }
  > = {};

  const today = new Date().toISOString().slice(0, 10);

  for (const entry of data) {
    if (!summary[entry.counterparty]) {
      summary[entry.counterparty] = {
        totalGiven: 0,
        totalReceived: 0,
        netBalance: 0,
        hasOverdue: false,
      };
    }

    const counterpartySummary = summary[entry.counterparty];
    if (!counterpartySummary) continue;

    if (entry.flow === 'Gave') {
      counterpartySummary.totalGiven += Number(entry.amount);
      if (entry.due_date && entry.due_date < today) {
        counterpartySummary.hasOverdue = true;
      }
    } else {
      counterpartySummary.totalReceived += Number(entry.amount);
    }

    counterpartySummary.netBalance =
      counterpartySummary.totalGiven - counterpartySummary.totalReceived;
  }

  return summary;
}
