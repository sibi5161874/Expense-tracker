import type { QueryClient } from '@tanstack/react-query';

/** Invalidates every query whose value depends on account cash balances. Any mutation that
 * creates, edits, or deletes a transaction — directly, or via an investment-log/cashbook
 * mirror — needs all of these, not just its own table's query key: issue #17 was exactly this,
 * editing a transaction or investment log entry left `accounts`/`netWorth`/report totals on
 * stale cached data until a hard reload. `reportTransactions` covers useReportsData's
 * `useAllTimeTransactions`/`useTransactionsInRange`, which AccountsTab and every Reports
 * sub-report read balances from. */
export function invalidateBalanceSensitiveQueries(queryClient: QueryClient, userId: string | undefined) {
  queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
  queryClient.invalidateQueries({ queryKey: ['transactionsCount', userId] });
  queryClient.invalidateQueries({ queryKey: ['accounts', userId] });
  queryClient.invalidateQueries({ queryKey: ['netWorth', userId] });
  queryClient.invalidateQueries({ queryKey: ['reportTransactions', userId] });
}
