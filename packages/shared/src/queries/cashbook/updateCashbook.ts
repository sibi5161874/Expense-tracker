import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { CashbookInput } from '../../schemas';
import { buildCashbookMirrorTransaction } from '../../logic/cashbookMirroring';
import { findOrCreateCategory } from '../investmentLog/createInvestmentLog';

export async function updateCashbook(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: Partial<CashbookInput>
) {
  const { data: before, error: beforeError } = await supabase
    .from('cashbook')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (beforeError) throw beforeError;

  const { data: result, error } = await supabase
    .from('cashbook')
    .update(data)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Keep the mirrored cash transaction in sync — same fix as updateInvestmentLog.ts for
  // issue #17, via the same `source_cashbook_id` exact-match link.
  try {
    const { data: existingMirror, error: findError } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('source_cashbook_id', id)
      .maybeSingle();
    if (findError) throw findError;

    const mirror = buildCashbookMirrorTransaction(result);

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
          .insert({ ...mirrorRow, user_id: userId, source_cashbook_id: id });
        if (insertError) throw insertError;
      }
    } else if (existingMirror) {
      const { error: deleteError } = await supabase.from('transactions').delete().eq('id', existingMirror.id);
      if (deleteError) throw deleteError;
    }
  } catch (mirrorError) {
    // `id`/`created_at`/`updated_at` aren't part of the Update type — only editable fields go back.
    const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...revertData } = before;
    await supabase.from('cashbook').update(revertData).eq('user_id', userId).eq('id', id);
    throw mirrorError;
  }

  return result;
}
