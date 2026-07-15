import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

const PAGE_SIZE = 50;

export interface GetInvestmentLogOptions {
  symbol?: string;
  page?: number;
  action?: 'BUY' | 'SELL' | 'SIP' | 'DIVIDEND' | 'BONUS' | 'SPLIT';
  asset_type?: 'Stock' | 'ETF' | 'Mutual Fund' | 'Crypto' | 'Bond' | 'Other';
}

export async function getInvestmentLog(
  supabase: SupabaseClient<Database>,
  userId: string,
  opts: GetInvestmentLogOptions = {}
) {
  let query = supabase
    .from('investment_log')
    .select(`
      *,
      linked_account:accounts!investment_log_linked_account_id_fkey(id, name, type)
    `)
    .eq('user_id', userId);

  if (opts.symbol) {
    query = query.eq('symbol', opts.symbol);
  }

  if (opts.action) {
    query = query.eq('action', opts.action);
  }

  if (opts.asset_type) {
    query = query.eq('asset_type', opts.asset_type);
  }

  const page = opts.page ?? 0;
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  query = query.order('date', { ascending: false }).range(from, to);

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getInvestmentLogById(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
) {
  const { data, error } = await supabase
    .from('investment_log')
    .select(`
      *,
      linked_account:accounts!investment_log_linked_account_id_fkey(id, name, type)
    `)
    .eq('user_id', userId)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Unpaginated fetch for portfolio aggregation (units held, avg cost, P&L) — never
 * for list rendering. RULES.md §15 says this aggregation should ultimately move to
 * a SQL view (Phase 3); this is the interim fix for computing it over the full
 * dataset instead of silently truncating to one page of 50 rows.
 */
export async function getAllInvestmentLog(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('investment_log')
    .select('id, date, symbol, exchange, action, quantity, price, fees, asset_type')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5000);

  if (error) throw error;
  return data;
}
