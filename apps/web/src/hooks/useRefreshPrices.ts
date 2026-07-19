import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';

export interface RefreshPricesResult {
  updated: string[];
  failed: string[];
  failedReasons?: Record<string, string>;
  message?: string;
}

/** Invokes the refresh-prices Edge Function (Stock/ETF live prices via Yahoo Finance — DATA_MODEL.md §3). */
export function useRefreshPrices() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (): Promise<RefreshPricesResult> => {
      const { data, error } = await supabase.functions.invoke<RefreshPricesResult>('refresh-prices');
      if (error) throw error;
      if (!data) throw new Error('No response from refresh-prices');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings', userId] });
    },
  });

  return {
    refresh: mutation.mutateAsync,
    isRefreshing: mutation.isPending,
    result: mutation.data,
    error: mutation.error,
  };
}
