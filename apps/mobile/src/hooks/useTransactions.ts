import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import {
  getTransactions,
  getAllTransactionsForMonth,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@repo/shared/queries/transactions';
import type { TransactionInput } from '@repo/shared/schemas';

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

/** Income/expense totals + category breakdown for one calendar month. Mirrors web's useMonthlyOverview. */
export function useMonthlyOverview(month: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  const query = useQuery({
    queryKey: ['monthlyOverview', userId, month],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getAllTransactionsForMonth(supabase, userId, month);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const overview = useMemo(() => {
    const income = query.data?.reduce((sum, t) => (t.type === 'Income' ? sum + t.amount : sum), 0) ?? 0;
    const expense = query.data?.reduce((sum, t) => (t.type === 'Expense' ? sum + t.amount : sum), 0) ?? 0;
    const netSavings = income - expense;
    const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

    const byCategory = new Map<string, number>();
    for (const t of query.data ?? []) {
      if (t.type !== 'Expense') continue;
      const name = t.category?.name ?? 'Uncategorized';
      byCategory.set(name, (byCategory.get(name) ?? 0) + t.amount);
    }
    const categoryBreakdown = Array.from(byCategory, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return { income, expense, netSavings, savingsRate, categoryBreakdown };
  }, [query.data]);

  return { ...query, ...overview };
}
