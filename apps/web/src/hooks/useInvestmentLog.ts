import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import {
  getInvestmentLog,
  getInvestmentLogCount,
  getAllInvestmentLog,
  createInvestmentLog,
  createInvestmentLogsBulk,
  updateInvestmentLog,
  deleteInvestmentLog,
  deleteInvestmentLogBulk,
  INVESTMENT_LOG_PAGE_SIZE,
} from '@repo/shared/queries/investmentLog';
import type { InvestmentLogInput } from '@repo/shared/schemas';
import { STALE_TIME_SHORT } from '@/lib/queryStaleTimes';
import { useAccounts } from '@/hooks/useAccounts';
import { useHoldings } from '@/hooks/useHoldings';

/** Removes rows with the given ids from every cached `['investmentLog', userId, ...]` page —
 * shared by both the single and bulk delete mutations' optimistic update. */
function removeFromInvestmentLogCache(old: unknown, ids: Set<string>) {
  return Array.isArray(old) ? old.filter((row) => !ids.has(row.id)) : old;
}

export function useInvestmentLog(
  opts: {
    symbol?: string;
    page?: number;
    pageSize?: number;
    action?: 'BUY' | 'SELL' | 'SIP' | 'DIVIDEND' | 'BONUS' | 'SPLIT';
    search?: string;
    sortBy?: 'date' | 'quantity' | 'price';
    sortAscending?: boolean;
  } = {}
) {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  // Same reasoning as useTransactions/useCashbook: a fund's display name ("Parag Parikh Flexi
  // Cap") isn't a column on investment_log, only its symbol/scheme-code is, so a name match
  // is resolved to symbols client-side (via the holdings list, already cached) instead of an
  // embedded-join OR filter. Account-name matches are resolved the same way. `useHoldings`
  // dedupes against whatever else on the page already called it — React Query keys on the
  // query, not the call site.
  const { data: holdings } = useHoldings();
  const { data: allAccounts } = useAccounts();
  const search = opts.search?.trim();
  const { symbols, accountIds } = useMemo(() => {
    if (!search) return { symbols: undefined, accountIds: undefined };
    const q = search.toLowerCase();
    const symbols = (holdings ?? [])
      .filter((h) => h.display_name?.toLowerCase().includes(q))
      .map((h) => h.symbol);
    const accountIds = (allAccounts ?? []).filter((a) => a.name.toLowerCase().includes(q)).map((a) => a.id);
    return {
      symbols: symbols.length > 0 ? symbols : undefined,
      accountIds: accountIds.length > 0 ? accountIds : undefined,
    };
  }, [search, holdings, allAccounts]);

  const searchOpts = { ...opts, search, symbols, accountIds };

  const query = useQuery({
    queryKey: ['investmentLog', userId, searchOpts],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getInvestmentLog(supabase, userId, searchOpts);
    },
    enabled: !!userId,
    staleTime: STALE_TIME_SHORT,
  });

  // Kept separate from the row query above (a `head: true` count-only request) so paginated
  // views can render "Page X of Y" without adding a count to every page's payload.
  const countQuery = useQuery({
    queryKey: ['investmentLogCount', userId, opts.symbol, opts.action, search, symbols, accountIds],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getInvestmentLogCount(supabase, userId, { symbol: opts.symbol, action: opts.action, search, symbols, accountIds });
    },
    enabled: !!userId,
    staleTime: STALE_TIME_SHORT,
  });

  const createMutation = useMutation({
    mutationFn: (data: InvestmentLogInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createInvestmentLog(supabase, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentLog', userId] });
      queryClient.invalidateQueries({ queryKey: ['investmentLogCount', userId] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
    },
  });

  const createBulkMutation = useMutation({
    mutationFn: (rows: InvestmentLogInput[]) => {
      if (!userId) throw new Error('User not authenticated');
      return createInvestmentLogsBulk(supabase, userId, rows);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentLog', userId] });
      queryClient.invalidateQueries({ queryKey: ['investmentLogCount', userId] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvestmentLogInput> }) => {
      if (!userId) throw new Error('User not authenticated');
      return updateInvestmentLog(supabase, userId, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentLog', userId] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteInvestmentLog(supabase, userId, id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['investmentLog', userId], exact: false });
      const previous = queryClient.getQueriesData({ queryKey: ['investmentLog', userId], exact: false });
      const ids = new Set([id]);
      queryClient.setQueriesData({ queryKey: ['investmentLog', userId], exact: false }, (old) =>
        removeFromInvestmentLogCache(old, ids)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentLog', userId] });
      queryClient.invalidateQueries({ queryKey: ['investmentLogCount', userId] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
    },
  });

  const deleteBulkMutation = useMutation({
    mutationFn: (ids: string[]) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteInvestmentLogBulk(supabase, userId, ids);
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['investmentLog', userId], exact: false });
      const previous = queryClient.getQueriesData({ queryKey: ['investmentLog', userId], exact: false });
      const idSet = new Set(ids);
      queryClient.setQueriesData({ queryKey: ['investmentLog', userId], exact: false }, (old) =>
        removeFromInvestmentLogCache(old, idSet)
      );
      return { previous };
    },
    onError: (_err, _ids, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentLog', userId] });
      queryClient.invalidateQueries({ queryKey: ['investmentLogCount', userId] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
    },
  });

  return {
    ...query,
    totalCount: countQuery.data,
    pageSize: opts.pageSize ?? INVESTMENT_LOG_PAGE_SIZE,
    createInvestmentLog: createMutation.mutateAsync,
    createInvestmentLogsBulk: createBulkMutation.mutateAsync,
    updateInvestmentLog: updateMutation.mutateAsync,
    deleteInvestmentLog: deleteMutation.mutate,
    deleteInvestmentLogBulk: deleteBulkMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending || deleteBulkMutation.isPending,
  };
}

/** Unpaginated fetch for portfolio aggregation — never render this as a list. */
export function useAllInvestmentLog() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['allInvestmentLog', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getAllInvestmentLog(supabase, userId);
    },
    enabled: !!userId,
    staleTime: STALE_TIME_SHORT,
  });
}
