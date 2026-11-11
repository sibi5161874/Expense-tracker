import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { InvestmentLogInput } from '../../schemas';
import { buildInvestmentLogMirrorTransaction } from '../../logic/investmentMirroring';
import { findOrCreateCategory } from './createInvestmentLog';

export async function createInvestmentLogsBulk(
  supabase: SupabaseClient<Database>,
  userId: string,
  rows: InvestmentLogInput[]
) {
  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from('investment_log')
    .insert(rows.map((row) => ({ ...row, user_id: userId })))
    .select();

  if (error) throw error;

  // Mirror the cash side of entries into `transactions` — otherwise BUY/SELL/SIP/DIVIDEND
  // in bulk (CSV or Broker import) distorts net worth (portfolio updates, but cash balance stays put).
  // Paired against `data` (the inserted rows, with ids) by index, not `rows` directly — a
  // single bulk INSERT preserves input order, and the id is what lets an edit later find this
  // exact mirror row again (see updateInvestmentLog.ts / issue #17).
  const mirrors = data
    .map((inserted, i) => ({ investmentLogId: inserted.id, mirror: buildInvestmentLogMirrorTransaction(rows[i]!) }))
    .filter((m): m is { investmentLogId: string; mirror: NonNullable<ReturnType<typeof buildInvestmentLogMirrorTransaction>> } => m.mirror !== null);

  if (mirrors.length > 0) {
    const categoryCache = new Map<string, string>();
    const transactionsToInsert = [];

    for (const { investmentLogId, mirror } of mirrors) {
      const catKey = `${mirror.categoryName}:${mirror.categoryType}`;
      let categoryId = categoryCache.get(catKey);
      if (!categoryId) {
        categoryId = await findOrCreateCategory(supabase, userId, mirror.categoryName, mirror.categoryType);
        categoryCache.set(catKey, categoryId);
      }

      transactionsToInsert.push({
        user_id: userId,
        date: mirror.date,
        type: mirror.type,
        amount: mirror.amount,
        from_account_id: mirror.from_account_id,
        category_id: categoryId,
        notes: mirror.notes,
        source_investment_log_id: investmentLogId,
      });
    }

    const { error: txError } = await supabase.from('transactions').insert(transactionsToInsert);
    if (txError) {
      // The Supabase JS client has no cross-table transaction — roll back the investment_log
      // rows by hand so a failed mirror never leaves entries with no matching cash movement.
      const insertedIds = (data ?? []).map((row) => row.id);
      if (insertedIds.length > 0) {
        await supabase.from('investment_log').delete().in('id', insertedIds);
      }
      throw txError;
    }
  }

  return data;
}
