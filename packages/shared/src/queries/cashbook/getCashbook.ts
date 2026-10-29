import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

export const CASHBOOK_PAGE_SIZE = 10;
const PAGE_SIZE = CASHBOOK_PAGE_SIZE;

export interface GetCashbookOptions {
  counterparty?: string;
  page?: number;
  pageSize?: number;
  flow?: 'Gave' | 'Received';
  /** Free-text match against `counterparty` — OR'd with `accountIds` below, same reasoning
   * as getTransactions: an embedded-table OR filter would force an inner join and silently
   * drop every row with no account set, so account-name matches are resolved to ids
   * client-side (accounts are a small, already-cached list) and passed in as plain ids. */
  search?: string;
  accountIds?: string[];
}

function buildSearchOrClause(opts: Pick<GetCashbookOptions, 'search' | 'accountIds'>): string | null {
  const clauses: string[] = [];
  const search = opts.search?.trim();
  if (search) {
    const escaped = search.replace(/[%,()]/g, (c) => `\\${c}`);
    clauses.push(`counterparty.ilike.%${escaped}%`);
  }
  if (opts.accountIds?.length) {
    clauses.push(`account_used_id.in.(${opts.accountIds.join(',')})`);
  }
  return clauses.length > 0 ? clauses.join(',') : null;
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

  const searchOr = buildSearchOrClause(opts);
  if (searchOr) {
    query = query.or(searchOr);
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
  opts: Pick<GetCashbookOptions, 'counterparty' | 'flow' | 'search' | 'accountIds'> = {}
) {
  let query = supabase
    .from('cashbook')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (opts.counterparty) query = query.eq('counterparty', opts.counterparty);
  if (opts.flow) query = query.eq('flow', opts.flow);

  const searchOr = buildSearchOrClause(opts);
  if (searchOr) {
    query = query.or(searchOr);
  }

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

  // Group by counterparty and calculate net balance and transaction count
  const summary: Record<
    string,
    { totalGiven: number; totalReceived: number; netBalance: number; hasOverdue: boolean; transactionCount: number }
  > = {};

  const today = new Date().toISOString().slice(0, 10);

  for (const entry of data) {
    if (!summary[entry.counterparty]) {
      summary[entry.counterparty] = {
        totalGiven: 0,
        totalReceived: 0,
        netBalance: 0,
        hasOverdue: false,
        transactionCount: 0,
      };
    }

    const counterpartySummary = summary[entry.counterparty];
    if (!counterpartySummary) continue;

    counterpartySummary.transactionCount += 1;

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
