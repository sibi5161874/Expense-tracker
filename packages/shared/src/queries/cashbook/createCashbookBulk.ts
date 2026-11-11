import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { CashbookInput } from '../../schemas';
import { buildCashbookMirrorTransaction } from '../../logic/cashbookMirroring';
import { findOrCreateCategory } from '../investmentLog/createInvestmentLog';

export async function createCashbookBulk(
  supabase: SupabaseClient<Database>,
  userId: string,
  rows: CashbookInput[]
) {
  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from('cashbook')
    .insert(rows.map((row) => ({ ...row, user_id: userId })))
    .select();

  if (error) throw error;

  // Mirror the cash side into `transactions` — otherwise lending/borrowing via cashbook
  // in bulk (e.g. CSV import) never touches the account it was actually paid from/into.
  // Paired against `data` (the inserted rows, with ids) by index — see the matching comment
  // in createInvestmentLogsBulk.ts.
  const mirrors = data
    .map((inserted, i) => ({ cashbookId: inserted.id, mirror: buildCashbookMirrorTransaction(rows[i]!) }))
    .filter((m): m is { cashbookId: string; mirror: NonNullable<ReturnType<typeof buildCashbookMirrorTransaction>> } => m.mirror !== null);

  if (mirrors.length > 0) {
    const categoryCache = new Map<string, string>();
    const transactionsToInsert = [];
    for (const { cashbookId, mirror } of mirrors) {
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
        source_cashbook_id: cashbookId,
      });
    }

    const { error: txError } = await supabase.from('transactions').insert(transactionsToInsert);
    if (txError) {
      // The Supabase JS client has no cross-table transaction — roll back the cashbook
      // rows by hand so a failed mirror never leaves entries with no matching cash movement.
      const insertedIds = (data ?? []).map((row) => row.id);
      if (insertedIds.length > 0) {
        await supabase.from('cashbook').delete().in('id', insertedIds);
      }
      throw txError;
    }
  }

  return data;
}
