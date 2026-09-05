import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import {
  getTransactions,
  getMonthlyTransactionSummary,
  getMonthlyCategoryBreakdown,
  getAllTransactionsForMonth,
  getRecentExpensesForInsight,
  getTransactionsForDate,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@repo/shared/queries/transactions';
import type { TransactionInput } from '@repo/shared/schemas';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Mirrors apps/web/src/hooks/useTransactions.ts. */
export function useTransactions(opts: { month?: string; page?: number } = {}) {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['transactions', userId, opts],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getTransactions(supabase, userId, opts);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  // mutationKey lets a paused (offline) mutation survive a full app restart, not just
  // backgrounding — see src/lib/mutationDefaults.ts, which registers the matching
  // "detached" mutationFn TanStack Query falls back to when resuming after a cold start.
  const createMutation = useMutation({
    mutationKey: ['createTransaction'],
    mutationFn: (data: TransactionInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createTransaction(supabase, userId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions', userId] }),
  });

  const updateMutation = useMutation({
    mutationKey: ['updateTransaction'],
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateTransaction(supabase, userId, id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions', userId] }),
  });

  const deleteMutation = useMutation({
    mutationKey: ['deleteTransaction'],
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteTransaction(supabase, userId, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions', userId] }),
  });

  return {
    ...query,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/** Income/expense totals + category breakdown for one calendar month, computed in Postgres
 * (RULES.md §14) — mirrors apps/web/src/hooks/useTransactions.ts's useMonthlyOverview. */
export function useMonthlyOverview(month: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  const summaryQuery = useQuery({
    queryKey: ['monthlyTransactionSummary', userId, month],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getMonthlyTransactionSummary(supabase, userId, month);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const categoryQuery = useQuery({
    queryKey: ['monthlyCategoryBreakdown', userId, month],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getMonthlyCategoryBreakdown(supabase, userId, month);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const overview = useMemo(() => {
    const income = summaryQuery.data?.income ?? 0;
    const expense = summaryQuery.data?.expense ?? 0;
    const netSavings = income - expense;
    const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;
    const categoryBreakdown = (categoryQuery.data ?? []).map((c) => ({ name: c.category_name, value: c.amount }));

    return { income, expense, netSavings, savingsRate, categoryBreakdown };
  }, [summaryQuery.data, categoryQuery.data]);

  return {
    ...overview,
    isLoading: summaryQuery.isLoading || categoryQuery.isLoading,
    error: summaryQuery.error || categoryQuery.error,
  };
}

/** Every transaction in one calendar month, row-level — for consumers that genuinely need
 * individual rows (the calendar view's per-day type flags) rather than the pre-aggregated
 * numbers useMonthlyOverview now returns. Mirrors apps/web's useTransactionsForMonth. */
export function useTransactionsForMonth(month: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['transactionsForMonth', userId, month],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getAllTransactionsForMonth(supabase, userId, month);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

/** Mirrors apps/web/src/hooks/useTransactions.ts's useTransactionsForDate — all of a user's
 * transactions on one exact date, with account/category joins, backing the calendar view's
 * date-detail screen. */
export function useTransactionsForDate(date: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['transactionsForDate', userId, date],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getTransactionsForDate(supabase, userId, date);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

/** Mirrors apps/web/src/hooks/useTransactions.ts's useRecentExpensesForInsight. */
export function useRecentExpensesForInsight() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  // Same tradeoff as web's version — this only needs to be right as of whenever the hook
  // next runs for an unrelated reason, not to tick live.
  // eslint-disable-next-line react-hooks/purity -- see comment above
  const sinceDate = new Date(Date.now() - THIRTY_DAYS_MS).toISOString().slice(0, 10);

  return useQuery({
    queryKey: ['recentExpensesForInsight', userId, sinceDate],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getRecentExpensesForInsight(supabase, userId, sinceDate);
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}
