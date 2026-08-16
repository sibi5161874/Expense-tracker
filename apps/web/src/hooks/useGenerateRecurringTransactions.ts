import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getDueRecurringTransactions, updateRecurringTransaction } from '@repo/shared/queries/recurringTransactions';
import { createTransactionsBulk } from '@repo/shared/queries/transactions';
import { getDueOccurrences } from '@repo/shared/logic';
import type { TransactionInput } from '@repo/shared/schemas';

/**
 * No server cron exists in this app — this is the "lazy cron" instead: once
 * per authenticated session, check for recurring rules that have come due and
 * materialize them into real `transactions` rows, advancing each rule's
 * next_run_date past today. Runs once on mount (AppLayout), not on every
 * render — a `hasRun` ref guards against React StrictMode's dev double-invoke
 * and against re-firing on unrelated re-renders.
 */
export function useGenerateRecurringTransactions() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!userId || hasRun.current) return;
    hasRun.current = true;

    async function generate() {
      const today = new Date().toISOString().slice(0, 10);
      const dueRules = await getDueRecurringTransactions(supabase, userId!, today);
      if (dueRules.length === 0) return;

      const newTransactions: TransactionInput[] = [];
      for (const rule of dueRules) {
        const { occurrenceDates, nextRunDate } = getDueOccurrences(rule.next_run_date, rule.frequency, today);

        for (const date of occurrenceDates) {
          newTransactions.push({
            date,
            type: rule.type,
            category_id: rule.category_id,
            sub_category: rule.sub_category ?? undefined,
            amount: rule.amount,
            from_account_id: rule.from_account_id,
            to_account_id: rule.to_account_id,
            notes: rule.notes ?? undefined,
          });
        }

        await updateRecurringTransaction(supabase, userId!, rule.id, { next_run_date: nextRunDate });
      }

      await createTransactionsBulk(supabase, userId!, newTransactions);

      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['monthlyOverview', userId] });
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions', userId] });
    }

    generate().catch((error: unknown) => {
      // Best-effort background sync — a failure here must never block app load.
      //
      // "relation does not exist" (42P01) means the recurring_transactions
      // migration hasn't been applied yet. That's a deployment state, not a
      // fault, and it would otherwise log an error on every single page load —
      // so it's reported once as a quiet warning with the actual fix.
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        console.warn(
          'Recurring transactions are unavailable: the recurring_transactions table is missing. Run the pending Supabase migrations (supabase db push) to enable them.'
        );
        return;
      }

      // Supabase errors are plain objects, so logging them directly prints "{}".
      // Pull the useful fields out explicitly.
      const details = error as { message?: string; code?: string; details?: string; hint?: string } | null;
      console.error('Failed to generate recurring transactions:', {
        message: details?.message ?? String(error),
        code: details?.code,
        details: details?.details,
        hint: details?.hint,
      });
    });
  }, [userId, supabase, queryClient]);
}
