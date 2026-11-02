import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { CashbookInput } from '../../schemas';
import { buildCashbookMirrorTransaction } from '../../logic/cashbookMirroring';

export async function createCashbook(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: CashbookInput
) {
  const { data: result, error } = await supabase
    .from('cashbook')
    .insert({
      ...data,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // Mirror the cash side into `transactions` — otherwise lending/borrowing via the cashbook
  // never touches the account it was actually paid from/into.
  const mirror = buildCashbookMirrorTransaction(data);
  if (mirror) {
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      date: mirror.date,
      type: mirror.type,
      amount: mirror.amount,
      from_account_id: mirror.from_account_id,
      notes: mirror.notes,
    });
    if (txError) {
      // The Supabase JS client has no cross-table transaction — roll back the cashbook row by
      // hand so a failed mirror never leaves a "Gave"/"Received" entry with no matching cash
      // movement, which is exactly the net-worth inflation bug this mirroring exists to fix.
      await supabase.from('cashbook').delete().eq('id', result.id);
      throw txError;
    }
  }

  return result;
}
