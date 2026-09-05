import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

/**
 * RULES.md §14 follow-up — replaces the previous "fetch every transaction in the month,
 * reduce in JS" approach with the get_monthly_transaction_summary/get_monthly_category_
 * breakdown Postgres functions (supabase/migrations/20260820000001_monthly_transaction_
 * aggregates.sql), which do the SUM/GROUP BY in the database. Only the aggregate numbers
 * cross the wire now, not every row.
 */
export async function getMonthlyTransactionSummary(
  supabase: SupabaseClient<Database>,
  userId: string,
  month: string
) {
  const { data, error } = await supabase.rpc('get_monthly_transaction_summary', {
    p_user_id: userId,
    p_month: month,
  });
  if (error) throw error;
  return data[0] ?? { income: 0, expense: 0 };
}

export async function getMonthlyCategoryBreakdown(
  supabase: SupabaseClient<Database>,
  userId: string,
  month: string
) {
  const { data, error } = await supabase.rpc('get_monthly_category_breakdown', {
    p_user_id: userId,
    p_month: month,
  });
  if (error) throw error;
  return data;
}

/** Backs useMonthlyTrend — one call for N months instead of N separate month queries. */
export async function getMonthlyTrend(supabase: SupabaseClient<Database>, userId: string, monthsBack: number) {
  const { data, error } = await supabase.rpc('get_monthly_trend', {
    p_user_id: userId,
    p_months_back: monthsBack,
  });
  if (error) throw error;
  return data;
}
