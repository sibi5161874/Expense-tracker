import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { DividendEntryInput } from '@repo/shared/schemas';

interface ImportDividendsResult {
  committed: number;
  duplicateCount: number;
}

/** Posts confirmed dividends (from the bank-statement import review step) straight to the
 * investment log via /api/import/dividends — see that route for why this never touches
 * /api/import/bank-statement's own commit path. */
export function useImportDividends() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (entries: DividendEntryInput[]): Promise<ImportDividendsResult> => {
      const res = await fetch('/api/import/dividends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save dividends');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentLog', userId] });
      queryClient.invalidateQueries({ queryKey: ['investmentLogCount', userId] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog', userId] });
    },
  });

  return {
    importDividends: mutation.mutateAsync,
    isImporting: mutation.isPending,
  };
}
