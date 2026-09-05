import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import {
  getTransactions,
  getMonthlyTransactionSummary,
  getMonthlyCategoryBreakdown,
  getAllTransactionsForMonth,
  getTransactionsForDate,
  getRecentExpensesForInsight,
  createTransaction,
  createTransactionsBulk,
  updateTransaction,
  deleteTransaction,
  deleteTransactionsBulk,
} from '@repo/shared/queries/transactions';
import type { TransactionInput } from '@repo/shared/schemas';

/** Removes rows with the given ids from every cached `['transactions', userId, ...]` page —
 * shared by both the single and bulk delete mutations' optimistic update. */
function removeFromTransactionsCache(old: unknown, ids: Set<string>) {
  return Array.isArray(old) ? old.filter((row) => !ids.has(row.id)) : old;
}

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

  const createMutation = useMutation({
    mutationFn: (data: TransactionInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createTransaction(supabase, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    },
  });

  const createBulkMutation = useMutation({
    mutationFn: (rows: TransactionInput[]) => {
      if (!userId) throw new Error('User not authenticated');
      return createTransactionsBulk(supabase, userId, rows);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateTransaction(supabase, userId, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteTransaction(supabase, userId, id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['transactions', userId], exact: false });
      const previous = queryClient.getQueriesData({ queryKey: ['transactions', userId], exact: false });
      const ids = new Set([id]);
      queryClient.setQueriesData({ queryKey: ['transactions', userId], exact: false }, (old) =>
        removeFromTransactionsCache(old, ids)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    },
  });

  const deleteBulkMutation = useMutation({
    mutationFn: (ids: string[]) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteTransactionsBulk(supabase, userId, ids);
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['transactions', userId], exact: false });
      const previous = queryClient.getQueriesData({ queryKey: ['transactions', userId], exact: false });
      const idSet = new Set(ids);
      queryClient.setQueriesData({ queryKey: ['transactions', userId], exact: false }, (old) =>
        removeFromTransactionsCache(old, idSet)
      );
      return { previous };
    },
    onError: (_err, _ids, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    },
  });

  return {
    ...query,
    createTransaction: createMutation.mutateAsync,
    createTransactionsBulk: createBulkMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutate,
    deleteTransactionsBulk: deleteBulkMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending || deleteBulkMutation.isPending,
  };
}

/**
 * Income/expense totals and category breakdown for one calendar month — computed in
 * Postgres via get_monthly_transaction_summary/get_monthly_category_breakdown (RULES.md
 * §14), not by fetching every transaction in the month and reducing client-side.
 */
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

/**
 * Every transaction in one calendar month, row-level — for the two consumers that
 * genuinely need individual rows (the calendar view's per-day type flags, the budget tab's
 * per-category-id actual-spend totals) rather than the pre-aggregated numbers
 * useMonthlyOverview now returns. Not part of the RULES.md §14 fix — these callers need the
 * raw rows by nature, so there's no aggregate query that could replace this one.
 */
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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Expenses from the last 30 days — backs the dashboard's coffee-spend insight card. */
export function useRecentExpensesForInsight() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  // Date.now() makes this impure, same tradeoff as the portfolio page's staleness check
  // (see its comment) — this only needs to be right as of whenever the hook next runs for
  // an unrelated reason, not to tick live, so a timer-driven effect would be overkill for a
  // once-a-day-relevant window.
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

/** All of a user's transactions on one exact date, with account/category joins — backs the calendar view's date-detail page. */
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
