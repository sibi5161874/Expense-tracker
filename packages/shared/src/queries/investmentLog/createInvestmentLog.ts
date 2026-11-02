import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { InvestmentLogInput } from '../../schemas';
import { buildInvestmentLogMirrorTransaction } from '../../logic/investmentMirroring';

/** Finds a category by exact name+type for this user, creating it on first use — keeps the
 * mirrored cash transaction (below) in a real, filterable category instead of uncategorized. */
async function findOrCreateCategory(
  supabase: SupabaseClient<Database>,
  userId: string,
  name: string,
  type: 'Income' | 'Expense'
): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name)
    .eq('type', type)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from('categories')
    .insert({ user_id: userId, name, type })
    .select('id')
    .single();
  if (createError) throw createError;
  return created.id;
}

export async function createInvestmentLog(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: InvestmentLogInput
) {
  const { data: result, error } = await supabase
    .from('investment_log')
    .insert({
      ...data,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // Mirror the cash side of this entry into `transactions` — otherwise a BUY inflates net
  // worth (portfolio value goes up, the linked account's cash balance doesn't go down).
  const mirror = buildInvestmentLogMirrorTransaction(data);
  if (mirror) {
    const categoryId = await findOrCreateCategory(supabase, userId, mirror.categoryName, mirror.categoryType);
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      date: mirror.date,
      type: mirror.type,
      amount: mirror.amount,
      from_account_id: mirror.from_account_id,
      category_id: categoryId,
      notes: mirror.notes,
    });
    if (txError) {
      // The Supabase JS client has no cross-table transaction — roll back the investment_log
      // row by hand so a failed mirror never leaves a BUY/SELL with no matching cash
      // movement, which is exactly the net-worth inflation bug this mirroring exists to fix.
      await supabase.from('investment_log').delete().eq('id', result.id);
      throw txError;
    }
  }

  return result;
}
