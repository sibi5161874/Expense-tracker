import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { CashbookInput } from '../../schemas';
import { buildCashbookMirrorTransaction } from '../../logic/cashbookMirroring';

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
  const mirrors = rows
    .map((row) => buildCashbookMirrorTransaction(row))
    .filter((m): m is NonNullable<typeof m> => m !== null);

  if (mirrors.length > 0) {
    const transactionsToInsert = mirrors.map((mirror) => ({
      user_id: userId,
      date: mirror.date,
      type: mirror.type,
      amount: mirror.amount,
      from_account_id: mirror.from_account_id,
      notes: mirror.notes,
    }));

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
