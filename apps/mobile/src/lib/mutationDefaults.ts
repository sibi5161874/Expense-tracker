import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { createTransaction, updateTransaction, deleteTransaction } from "@repo/shared/queries/transactions";
import { createInvestmentLog, updateInvestmentLog, deleteInvestmentLog } from "@repo/shared/queries/investmentLog";
import { createGoal, updateGoal, deleteGoal } from "@repo/shared/queries/goals";
import { createCashbook, updateCashbook, deleteCashbook } from "@repo/shared/queries/cashbook";
import type { TransactionInput, InvestmentLogInput, GoalInput, CashbookInput } from "@repo/shared/schemas";

/**
 * A mutation paused while offline (see QueryProvider's `networkMode: "offlineFirst"`) gets
 * persisted to AsyncStorage along with the query cache — but only its `mutationKey` and
 * variables survive serialization, not the original `mutationFn` closure from whichever
 * hook created it. If the app is force-quit and relaunched while a write is still queued,
 * there's no mounted hook to supply that closure anymore.
 *
 * `setMutationDefaults` registers a `mutationKey → mutationFn` fallback the persist client
 * uses to resume orphaned mutations after a cold start. Each entry here must produce the
 * exact same call the live hook would have made — hence reading the current user fresh via
 * `supabase.auth.getUser()` rather than closing over a userId (there's no React tree here
 * to read one from, and the session may have changed since the write was queued).
 *
 * Covers the four highest-frequency offline write paths (Transactions, Investment Log,
 * Goals, Cashbook). Config/Assets/Insurance edits made offline still queue and resume
 * within the same app session (in-memory pause/resume, via the hooks' own mutationFn) —
 * they just won't survive a force-quit until they're added here too, same pattern.
 */
export function registerOfflineMutationDefaults(queryClient: QueryClient) {
  async function currentUserId(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    return user.id;
  }

  queryClient.setMutationDefaults(["createTransaction"], {
    mutationFn: async (data: TransactionInput) => createTransaction(supabase, await currentUserId(), data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });
  queryClient.setMutationDefaults(["updateTransaction"], {
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionInput> }) =>
      updateTransaction(supabase, await currentUserId(), id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });
  queryClient.setMutationDefaults(["deleteTransaction"], {
    mutationFn: async (id: string) => deleteTransaction(supabase, await currentUserId(), id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  queryClient.setMutationDefaults(["createInvestmentLog"], {
    mutationFn: async (data: InvestmentLogInput) => createInvestmentLog(supabase, await currentUserId(), data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["investmentLog"] }),
  });
  queryClient.setMutationDefaults(["updateInvestmentLog"], {
    mutationFn: async ({ id, data }: { id: string; data: Partial<InvestmentLogInput> }) =>
      updateInvestmentLog(supabase, await currentUserId(), id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["investmentLog"] }),
  });
  queryClient.setMutationDefaults(["deleteInvestmentLog"], {
    mutationFn: async (id: string) => deleteInvestmentLog(supabase, await currentUserId(), id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["investmentLog"] }),
  });

  queryClient.setMutationDefaults(["createGoal"], {
    mutationFn: async (data: GoalInput) => createGoal(supabase, await currentUserId(), data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
  queryClient.setMutationDefaults(["updateGoal"], {
    mutationFn: async ({ id, data }: { id: string; data: Partial<GoalInput> }) =>
      updateGoal(supabase, await currentUserId(), id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
  queryClient.setMutationDefaults(["deleteGoal"], {
    mutationFn: async (id: string) => deleteGoal(supabase, await currentUserId(), id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  queryClient.setMutationDefaults(["createCashbook"], {
    mutationFn: async (data: CashbookInput) => createCashbook(supabase, await currentUserId(), data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cashbook"] }),
  });
  queryClient.setMutationDefaults(["updateCashbook"], {
    mutationFn: async ({ id, data }: { id: string; data: Partial<CashbookInput> }) =>
      updateCashbook(supabase, await currentUserId(), id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cashbook"] }),
  });
  queryClient.setMutationDefaults(["deleteCashbook"], {
    mutationFn: async (id: string) => deleteCashbook(supabase, await currentUserId(), id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cashbook"] }),
  });
}
