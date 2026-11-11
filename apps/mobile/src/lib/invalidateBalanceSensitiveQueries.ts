import type { QueryClient } from '@tanstack/react-query';

/** Mirrors apps/web/src/lib/invalidateBalanceSensitiveQueries.ts — see its comment. Any
 * mutation that creates, edits, or deletes a transaction (directly, or via an investment-log/
 * cashbook mirror) needs all of these, not just its own table's query key (issue #17). There's
 * no separate `netWorth` query key on mobile (useNetWorth derives it from `accounts` +
 * `reportTransactions` client-side), so invalidating those two covers it here too. */
export function invalidateBalanceSensitiveQueries(queryClient: QueryClient, userId: string | undefined) {
  queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
  queryClient.invalidateQueries({ queryKey: ['accounts', userId] });
  queryClient.invalidateQueries({ queryKey: ['reportTransactions', userId] });
}
