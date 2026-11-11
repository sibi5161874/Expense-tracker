import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { InvestmentLogInput } from '../../schemas';
import { buildInvestmentLogMirrorTransaction } from '../../logic/investmentMirroring';
import { findOrCreateCategory } from './createInvestmentLog';

export async function updateInvestmentLog(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<InvestmentLogInput>
) {
  const { data: before, error: beforeError } = await supabase
    .from('investment_log')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (beforeError) throw beforeError;

  const { data: result, error } = await supabase
    .from('investment_log')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  // Keep the mirrored cash transaction in sync — otherwise editing quantity/price/fees/action
  // leaves the `transactions`-table side of the ledger stuck at its original amount while the
  // investment_log side moves on (issue #17). `source_investment_log_id` (added alongside this
  // fix) is the exact-match link, so no notes/date heuristic matching is needed.
  try {
    const { data: existingMirror, error: findError } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('source_investment_log_id', id)
      .maybeSingle();
    if (findError) throw findError;

    const mirror = buildInvestmentLogMirrorTransaction(result);

    if (mirror) {
      const categoryId = await findOrCreateCategory(supabase, userId, mirror.categoryName, mirror.categoryType);
      const mirrorRow = {
        date: mirror.date,
        type: mirror.type,
        amount: mirror.amount,
        from_account_id: mirror.from_account_id,
        category_id: categoryId,
        notes: mirror.notes,
      };
      if (existingMirror) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update(mirrorRow)
          .eq('id', existingMirror.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert({ ...mirrorRow, user_id: userId, source_investment_log_id: id });
        if (insertError) throw insertError;
      }
    } else if (existingMirror) {
      // The edit moved this entry to something that no longer mirrors (e.g. action changed
      // to BONUS/SPLIT, or the linked account was cleared) — the old cash movement it recorded
      // is no longer valid either, so remove it rather than leave a stale mirror behind.
      const { error: deleteError } = await supabase.from('transactions').delete().eq('id', existingMirror.id);
      if (deleteError) throw deleteError;
    }
  } catch (mirrorError) {
    // Best-effort revert: the Supabase JS client has no cross-table transaction, so put
    // investment_log back the way it was rather than leave it desynchronized from its mirror.
    // `id`/`created_at`/`updated_at`/`total_cashflow` aren't part of the Update type (computed
    // or immutable columns) — only the editable fields go back into .update().
    const { id: _id, created_at: _createdAt, updated_at: _updatedAt, total_cashflow: _totalCashflow, ...revertData } =
      before;
    await supabase.from('investment_log').update(revertData).eq('user_id', userId).eq('id', id);
    throw mirrorError;
  }

  return result;
}
